import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { asMember } from "./memberSession.js";

process.env.NODE_ENV = "test";
process.env.UPI_ID = "test-business@upi";
process.env.UPI_NAME = "MOMNT";
process.env.PAYMENT_EXPIRY_MINUTES = "30";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.JWT_SECRET = "test-admin-secret-value";

const { createApp } = await import("../app.js");
const Event = (await import("../models/Event.js")).default;
const Booking = (await import("../models/Booking.js")).default;
const Payment = (await import("../models/Payment.js")).default;
const Ticket = (await import("../models/Ticket.js")).default;
const Admin = (await import("../models/Admin.js")).default;
const { hashPassword } = await import("../utils/password.js");

const app = createApp();
let replSet;
const password = "MomntAdmin!2026";

async function seed() {
  await Promise.all([
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Ticket.deleteMany({}),
    Admin.deleteMany({}),
  ]);
  await Event.create({
    eventId: "momnt-01",
    slug: "premium-sunday-experience",
    number: "MOMNT #01",
    title: "The Premium Sunday Experience",
    location: "Ahmedabad",
    date: new Date("2026-10-25T00:00:00+05:30"),
    startTime: "11:00 AM",
    endTime: "4:00 PM",
    price: 3000,
    capacity: 50,
    bookedQuantity: 0,
    status: "published",
    image: "/images/event-01.jpg",
    description: "A premium private experience.",
    inclusions: ["Welcome Drink"],
  });
  await Admin.create({
    name: "MOMNT Admin",
    email: "admin@example.com",
    passwordHash: await hashPassword(password),
    role: "SUPER_ADMIN",
    status: "active",
  });
  await Admin.create({
    name: "Door Lead",
    email: "door@example.com",
    passwordHash: await hashPassword(password),
    role: "CHECK_IN_MANAGER",
    status: "active",
  });
}

async function login(email = "admin@example.com") {
  const agent = request.agent(app);
  const response = await agent.post("/api/admin/auth/login").send({ email, password });
  return { agent, response };
}

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(replSet.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

test.beforeEach(seed);

test("rejects an unknown admin without revealing whether the email exists", async () => {
  const missing = await request(app).post("/api/admin/auth/login").send({
    email: "missing@example.com",
    password: "WrongPass!123",
  });
  const wrong = await request(app).post("/api/admin/auth/login").send({
    email: "admin@example.com",
    password: "WrongPass!123",
  });
  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(missing.body.error.message, wrong.body.error.message);
  assert.equal(JSON.stringify(missing.body).includes("passwordHash"), false);
});

test("signs in with a cookie and blocks the dashboard after logout", async () => {
  const { agent, response } = await login();
  assert.equal(response.status, 200);
  assert.equal(response.body.admin.role, "SUPER_ADMIN");
  assert.equal(response.body.admin.passwordHash, undefined);
  assert.equal(response.body.admin.access.includes("payments_write"), true);
  const cookie = response.headers["set-cookie"].join(";");
  assert.match(cookie, /HttpOnly/i);
  assert.equal(cookie.includes(password), false);

  const me = await agent.get("/api/admin/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.admin.email, "admin@example.com");

  const dashboard = await agent.get("/api/admin/dashboard");
  assert.equal(dashboard.status, 200);
  assert.equal(typeof dashboard.body.stats.netRevenue, "number");
  assert.equal(dashboard.body.stats.grossRevenue, 0);

  const logout = await agent.post("/api/admin/auth/logout").set("X-CSRF-Token", response.body.csrfToken);
  assert.equal(logout.status, 200);
  const after = await agent.get("/api/admin/auth/me");
  assert.equal(after.status, 401);
});

test("enforces role checks and ignores a role sent by the browser", async () => {
  const door = await login("door@example.com");
  const denied = await door.agent.get("/api/admin/payments");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, "FORBIDDEN");

  const spoofed = await door.agent
    .post("/api/admin/payments/PAY-20261004-0001/verify")
    .set("X-CSRF-Token", door.response.body.csrfToken)
    .send({ role: "SUPER_ADMIN", status: "paid" });
  assert.equal(spoofed.status, 403);

  const open = await request(app).get("/api/admin/dashboard");
  assert.equal(open.status, 401);
});

test("verifies a submitted payment, issues access, and checks in once", async () => {
  const member = await asMember(app, { name: "Raj Patel", mobile: "9876543210", email: "raj@example.com" });
  const created = await member.agent
    .post("/api/bookings")
    .set("X-CSRF-Token", member.csrf)
    .set("Idempotency-Key", crypto.randomUUID())
    .send({
      eventId: "momnt-01",
      quantity: 2,
      customer: { name: "Raj Patel", mobile: "9876543210", email: "raj@example.com" },
      total: 1,
    });
  const bookingId = created.body.data.booking.bookingId;
  const payment = await request(app).post("/api/payments/create").send({ bookingId, amount: 1, status: "paid" });
  const paymentId = payment.body.payment.paymentId;
  await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: crypto.randomBytes(6).toString("hex").toUpperCase(),
    payerName: "Raj Patel",
  });

  const { agent, response } = await login();
  const missingCsrf = await agent.post(`/api/admin/payments/${paymentId}/verify`).send({});
  assert.equal(missingCsrf.status, 403);

  const verified = await agent
    .post(`/api/admin/payments/${paymentId}/verify`)
    .set("X-CSRF-Token", response.body.csrfToken)
    .send({ status: "paid", amount: 1 });
  assert.equal(verified.status, 200);
  assert.equal(verified.body.payment.status, "paid");

  const again = await agent
    .post(`/api/admin/payments/${paymentId}/verify`)
    .set("X-CSRF-Token", response.body.csrfToken)
    .send({});
  assert.equal(again.status, 409);

  const ticket = await Ticket.findOne({ bookingReference: bookingId });
  assert.ok(ticket);
  assert.equal(ticket.quantity, 2);

  const lookup = await agent
    .post("/api/admin/check-in/validate")
    .set("X-CSRF-Token", response.body.csrfToken)
    .send({ ticketId: ticket.ticketId });
  assert.equal(lookup.body.valid, true);
  assert.equal(ticket.status, "active");

  const checked = await agent
    .post(`/api/admin/tickets/${ticket.ticketId}/check-in`)
    .set("X-CSRF-Token", response.body.csrfToken)
    .send({});
  assert.equal(checked.status, 200);
  assert.equal(checked.body.ticket.status, "checked_in");

  const duplicate = await agent
    .post(`/api/admin/tickets/${ticket.ticketId}/check-in`)
    .set("X-CSRF-Token", response.body.csrfToken)
    .send({});
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "ALREADY_CHECKED_IN");

  const stats = await agent.get("/api/admin/dashboard");
  assert.equal(stats.body.stats.confirmedBookings, 1);
  assert.equal(stats.body.stats.grossRevenue, 6000);
  assert.equal(stats.body.stats.checkedIn, 1);
});

test("rejects a search operator instead of passing it to the database", async () => {
  const { agent } = await login();
  const response = await agent.get("/api/admin/bookings").query({ q: { $gt: "" } });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});
