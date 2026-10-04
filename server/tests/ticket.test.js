import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.UPI_ID = "test-business@upi";
process.env.UPI_NAME = "MOMNT";
process.env.UPI_DESCRIPTION = "MOMNT Event Booking";
process.env.PAYMENT_EXPIRY_MINUTES = "30";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.TICKET_PUBLIC_BASE_URL = "http://localhost:5173";

const { createApp } = await import("../app.js");
const Event = (await import("../models/Event.js")).default;
const Booking = (await import("../models/Booking.js")).default;
const Payment = (await import("../models/Payment.js")).default;
const Ticket = (await import("../models/Ticket.js")).default;
const TicketAuditLog = (await import("../models/TicketAuditLog.js")).default;
const Counter = (await import("../models/Counter.js")).default;
const { verifyPayment } = await import("../services/paymentService.js");
const {
  cancelTicket,
  expireTicket,
  generateTicketForBooking,
  markTicketRefunded,
} = await import("../services/ticketService.js");
const { checkInTicket } = await import("../services/checkInService.js");

const app = createApp();
let replSet;

const customer = {
  name: "Raj Patel",
  mobile: "9876543210",
  email: "raj@example.com",
};

function nextUtr() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function seedEvent() {
  await Promise.all([
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Ticket.deleteMany({}),
    TicketAuditLog.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  return Event.create({
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
}

async function book(quantity = 2) {
  const response = await request(app)
    .post("/api/bookings")
    .set("Idempotency-Key", `ticket-${crypto.randomUUID()}`)
    .send({ eventId: "momnt-01", quantity, customer, total: 1, price: 1 });
  assert.equal(response.status, 201);
  return response.body.data.booking.bookingId;
}

async function submitPayment(bookingId) {
  const payment = await request(app).post("/api/payments/create").send({ bookingId, amount: 1, status: "paid" });
  assert.equal(payment.status, 201);
  const paymentId = payment.body.payment.paymentId;
  const submitted = await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: nextUtr(),
    payerName: "Raj Patel",
  });
  assert.equal(submitted.status, 200);
  return paymentId;
}

async function confirmBooking(quantity = 2) {
  const bookingId = await book(quantity);
  const paymentId = await submitPayment(bookingId);
  const verified = await verifyPayment(paymentId);
  assert.equal(verified.status, "paid");
  return bookingId;
}

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(replSet.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

test.beforeEach(async () => {
  await seedEvent();
});

test("does not generate a ticket for an unpaid booking", async () => {
  const bookingId = await book(2);
  const response = await request(app).get(`/api/bookings/${bookingId}/ticket`);
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "TICKET_NOT_AVAILABLE");
  await assert.rejects(() => generateTicketForBooking(bookingId), (error) => error.code === "PAYMENT_NOT_CONFIRMED");
  assert.equal(await Ticket.countDocuments(), 0);
});

test("does not generate a ticket while verification is pending", async () => {
  const bookingId = await book(1);
  await submitPayment(bookingId);
  const response = await request(app).get(`/api/bookings/${bookingId}/ticket`);
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "TICKET_NOT_AVAILABLE");
  await assert.rejects(() => generateTicketForBooking(bookingId), (error) => error.code === "PAYMENT_NOT_CONFIRMED");
  assert.equal(await Ticket.countDocuments(), 0);
});

test("generates one ticket when payment is confirmed and keeps it idempotent", async () => {
  const bookingId = await confirmBooking(3);
  const first = await Ticket.findOne({ bookingReference: bookingId });
  const second = await generateTicketForBooking(bookingId);
  const third = await request(app).get(`/api/bookings/${bookingId}/ticket`);
  assert.equal(await Ticket.countDocuments(), 1);
  assert.equal(second.ticketId, first.ticketId);
  assert.equal(third.body.ticket.ticketId, first.ticketId);
  assert.equal(third.body.ticket.quantity, 3);
  assert.match(first.ticketId, /^MOMNT-01-[A-HJ-NP-Z2-9]{6}$/);
  assert.match(first.ticketNumber, /^MOMNT-01-\d{4}$/);
  assert.equal(first.qrToken.includes(bookingId), false);
  assert.ok(first.qrToken.length >= 32);
  assert.equal(first.ticketId.includes(String(first._id)), false);
});

test("rejects a second ticket for the same booking", async () => {
  const bookingId = await confirmBooking(1);
  const ticket = await Ticket.findOne({ bookingReference: bookingId });
  await assert.rejects(() =>
    Ticket.create({
      ticketId: "MOMNT-01-ZZZZZZ",
      ticketNumber: "MOMNT-01-9999",
      bookingId: ticket.bookingId,
      bookingReference: `${bookingId}-COPY`,
      eventId: ticket.eventId,
      customer: ticket.customer,
      eventSnapshot: ticket.eventSnapshot,
      quantity: ticket.quantity,
      qrToken: crypto.randomBytes(32).toString("base64url"),
      issuedAt: new Date(),
    }),
  );
  assert.equal(await Ticket.countDocuments({ bookingId: ticket.bookingId }), 1);
});

test("returns a public ticket without payment data or internal ids", async () => {
  const bookingId = await confirmBooking(2);
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  const response = await request(app).get(`/api/tickets/${stored.ticketId}`);
  assert.equal(response.status, 200);
  assert.match(response.headers["cache-control"], /no-store/);
  const raw = JSON.stringify(response.body);
  assert.equal(raw.includes("qrToken"), false);
  assert.equal(raw.includes("raj@example.com"), false);
  assert.equal(raw.includes("9876543210"), false);
  assert.equal(raw.includes("utr"), false);
  assert.equal(raw.includes("_id"), false);
  assert.equal(response.body.ticket.customer.name, "Raj Patel");
  assert.equal(response.body.ticket.event.title, "The Premium Sunday Experience");
  assert.equal(response.body.ticket.status, "active");
  assert.equal(response.body.ticket.bookingReference, bookingId);
});

test("keeps the issued event snapshot if the live event changes", async () => {
  const bookingId = await confirmBooking(1);
  await Event.updateOne({ eventId: "momnt-01" }, { title: "Changed Later", location: "Mumbai" });
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  const response = await request(app).get(`/api/tickets/${stored.ticketId}`);
  assert.equal(response.body.ticket.event.title, "The Premium Sunday Experience");
  assert.equal(response.body.ticket.event.location, "Ahmedabad");
});

test("serves a QR image and validates the token without checking in", async () => {
  const bookingId = await confirmBooking(2);
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  const image = await request(app).get(`/api/tickets/${stored.ticketId}/qr`);
  assert.equal(image.status, 200);
  assert.match(image.headers["content-type"], /image\/png/);
  assert.ok(image.body.length > 200);

  const valid = await request(app).get(`/api/tickets/validate/${stored.qrToken}`);
  assert.equal(valid.body.valid, true);
  assert.equal(valid.body.ticket.status, "active");
  assert.equal(valid.body.ticket.customerName, "Raj Patel");
  assert.equal(valid.body.ticket.email, undefined);
  const after = await Ticket.findById(stored._id);
  assert.equal(after.status, "active");
  assert.equal(after.checkedInAt, null);
});

test("rejects an unknown QR token without confirming a similar ticket", async () => {
  await confirmBooking(1);
  const response = await request(app).get("/api/tickets/validate/this-token-does-not-exist");
  assert.equal(response.status, 200);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.code, "INVALID_QR_TOKEN");
  assert.equal(response.body.ticket, undefined);
  assert.equal(JSON.stringify(response.body).includes("Raj Patel"), false);
});

test("reports checked-in, cancelled, refunded, and expired access", async () => {
  const bookingId = await confirmBooking(2);
  const stored = await Ticket.findOne({ bookingReference: bookingId });

  await checkInTicket(stored.ticketId);
  const checked = await request(app).get(`/api/tickets/validate/${stored.qrToken}`);
  assert.equal(checked.body.valid, false);
  assert.equal(checked.body.code, "ALREADY_CHECKED_IN");
  assert.ok(checked.body.ticket.checkedInAt);
  const duplicate = await checkInTicket(stored.ticketId).catch((error) => error);
  assert.equal(duplicate.code, "ALREADY_CHECKED_IN");

  const cancelledBooking = await confirmBooking(1);
  const cancelled = await Ticket.findOne({ bookingReference: cancelledBooking });
  await cancelTicket(cancelled.ticketId, "Plans changed");
  const cancelledView = await request(app).get(`/api/tickets/validate/${cancelled.qrToken}`);
  assert.equal(cancelledView.body.code, "TICKET_CANCELLED");
  assert.equal(cancelledView.body.valid, false);

  const refundedBooking = await confirmBooking(1);
  const refunded = await Ticket.findOne({ bookingReference: refundedBooking });
  await markTicketRefunded(refunded.ticketId);
  const refundedView = await request(app).get(`/api/tickets/validate/${refunded.qrToken}`);
  assert.equal(refundedView.body.code, "TICKET_REFUNDED");

  const expiredBooking = await confirmBooking(1);
  const expired = await Ticket.findOne({ bookingReference: expiredBooking });
  await expireTicket(expired.ticketId);
  const expiredView = await request(app).get(`/api/tickets/validate/${expired.qrToken}`);
  assert.equal(expiredView.body.code, "TICKET_EXPIRED");
});

test("does not check in after the event has ended", async () => {
  const bookingId = await confirmBooking(1);
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  stored.eventSnapshot.date = new Date("2020-01-01T00:00:00+05:30");
  stored.eventSnapshot.endTime = "1:00 PM";
  await stored.save();

  const blocked = await checkInTicket(stored.ticketId).catch((error) => error);
  assert.equal(blocked.code, "EVENT_ENDED");
  const fresh = await Ticket.findById(stored._id);
  assert.equal(fresh.status, "active");

  const view = await request(app).get(`/api/tickets/${stored.ticketId}`);
  assert.equal(view.body.ticket.status, "expired");
  const validation = await request(app).get(`/api/tickets/validate/${stored.qrToken}`);
  assert.equal(validation.body.valid, false);
  assert.equal(validation.body.code, "EVENT_ENDED");
});

test("check-in is atomic when two requests arrive together", async () => {
  const bookingId = await confirmBooking(2);
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  const results = await Promise.allSettled([
    checkInTicket(stored.ticketId),
    checkInTicket(stored.ticketId),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.code, "ALREADY_CHECKED_IN");
  assert.equal(await Ticket.countDocuments({ bookingId: stored.bookingId, status: "checked_in" }), 1);
});

test("ignores attempts to create, edit, or check in a ticket from the public API", async () => {
  const bookingId = await confirmBooking(2);
  const stored = await Ticket.findOne({ bookingReference: bookingId });
  const created = await request(app).post("/api/tickets").send({
    bookingId,
    status: "active",
    quantity: 4,
    customer: { name: "Hacker" },
  });
  const edited = await request(app).post(`/api/tickets/${stored.ticketId}`).send({
    status: "checked_in",
    quantity: 9,
    customer: { name: "Hacker" },
  });
  const checkIn = await request(app).post(`/api/admin/tickets/${stored.ticketId}/check-in`).send({ status: "checked_in" });
  const cancel = await request(app).post(`/api/admin/tickets/${stored.ticketId}/cancel`).send({});
  const missing = await request(app).get("/api/tickets/MOMNT-01-FAKEID");

  assert.equal(created.status, 404);
  assert.equal(edited.status, 404);
  assert.equal(checkIn.status, 401);
  assert.equal(cancel.status, 401);
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, "TICKET_NOT_FOUND");
  assert.equal(JSON.stringify(missing.body).includes("stack"), false);

  const fresh = await Ticket.findById(stored._id);
  assert.equal(fresh.status, "active");
  assert.equal(fresh.quantity, 2);
  assert.equal(fresh.customer.name, "Raj Patel");
});
