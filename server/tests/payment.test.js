import assert from "node:assert/strict";
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

const { createApp } = await import("../app.js");
const Event = (await import("../models/Event.js")).default;
const Booking = (await import("../models/Booking.js")).default;
const Payment = (await import("../models/Payment.js")).default;
const { verifyPayment, rejectPayment } = await import("../services/paymentService.js");

const app = createApp();
let replSet;

const customer = {
  name: "Raj Patel",
  mobile: "9876543210",
  email: "raj@example.com",
};

async function seedEvent(overrides = {}) {
  await Event.deleteMany({});
  await Booking.deleteMany({});
  await Payment.deleteMany({});
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
    ...overrides,
  });
}

async function book(quantity = 2, extra = {}) {
  const response = await request(app)
    .post("/api/bookings")
    .set("Idempotency-Key", extra.key || `book-${quantity}-${Date.now()}-${Math.random()}`)
    .send({
      eventId: "momnt-01",
      quantity,
      customer,
      total: 1,
      price: 1,
      ...extra.body,
    });
  return response;
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

test("creates a booking with a server-calculated amount", async () => {
  const response = await book(2);
  assert.equal(response.status, 201);
  assert.equal(response.body.data.booking.total, 6000);
  assert.equal(response.body.data.booking.subtotal, 6000);
  assert.equal(response.body.data.booking.bookingFee, 0);
  assert.equal(response.body.data.booking.paymentStatus, "pending");
  const event = await Event.findOne({ eventId: "momnt-01" });
  assert.equal(event.bookedQuantity, 2);
});

test("rejects an unknown experience", async () => {
  const response = await request(app).post("/api/bookings").send({
    eventId: "missing",
    quantity: 1,
    customer,
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "BOOKING_NOT_FOUND");
});

test("does not create a booking when the event cannot hold the passes", async () => {
  await Event.updateOne({ eventId: "momnt-01" }, { bookedQuantity: 49 });
  const response = await book(2);
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "EVENT_SOLD_OUT");
});

test("creates a payment from the stored booking total", async () => {
  const created = await book(2);
  const bookingId = created.body.data.booking.bookingId;
  const response = await request(app)
    .post("/api/payments/create")
    .send({ bookingId, amount: 1, status: "paid", total: 1 });
  assert.equal(response.status, 201);
  assert.equal(response.body.payment.amount, 6000);
  assert.equal(response.body.payment.status, "payment_initiated");
  assert.equal(response.body.payment.currency, "INR");
  assert.equal(response.body.payment.method, "upi");
  assert.equal(response.body.payment.upiId, "test-business@upi");
  assert.match(response.body.payment.upiIntentUrl, /^upi:\/\/pay\?/);
  assert.match(response.body.payment.upiIntentUrl, /am=6000/);
  assert.doesNotMatch(response.body.payment.upiIntentUrl, /am=1/);
});

test("returns the same payment when creation is repeated", async () => {
  const created = await book(1);
  const bookingId = created.body.data.booking.bookingId;
  const first = await request(app).post("/api/payments/create").set("Idempotency-Key", "same-key").send({ bookingId });
  const second = await request(app).post("/api/payments/create").set("Idempotency-Key", "same-key").send({ bookingId });
  assert.equal(first.body.payment.paymentId, second.body.payment.paymentId);
  assert.equal(await Payment.countDocuments({ bookingReference: bookingId }), 1);
});

test("rejects payment creation for a missing booking", async () => {
  const response = await request(app).post("/api/payments/create").send({ bookingId: "MOMNT-20261004-0000" });
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "BOOKING_NOT_FOUND");
});

test("rejects payment creation when the booking has expired", async () => {
  const created = await book(1);
  await Booking.updateOne(
    { bookingId: created.body.data.booking.bookingId },
    { paymentExpiresAt: new Date(Date.now() - 1000), paymentStatus: "pending", bookingStatus: "payment_pending" },
  );
  const response = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "BOOKING_EXPIRED");
});

test("rejects a tampered booking total", async () => {
  const created = await book(2);
  await Booking.updateOne({ bookingId: created.body.data.booking.bookingId }, { total: 1 });
  const response = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "INVALID_AMOUNT");
});

test("rejects an invalid UTR and accepts a valid submission without marking it paid", async () => {
  const created = await book(2);
  const payment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  const paymentId = payment.body.payment.paymentId;

  const invalid = await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: "123",
    payerName: "Raj Patel",
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "INVALID_UTR");

  const submitted = await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: "1234 5678 9012",
    payerName: "Raj Patel",
  });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.payment.status, "verification_pending");
  assert.notEqual(submitted.body.payment.status, "paid");

  const stored = await Payment.findOne({ paymentReference: paymentId });
  assert.equal(stored.status, "verification_pending");
  assert.equal(stored.utr, "123456789012");

  const again = await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: "123456789012",
    payerName: "Raj Patel",
  });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, "PAYMENT_ALREADY_SUBMITTED");
});

test("rejects a UTR that was already used", async () => {
  const firstBooking = await book(1, { key: "dup-a" });
  const secondBooking = await book(1, { key: "dup-b" });
  const firstPayment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: firstBooking.body.data.booking.bookingId });
  const secondPayment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: secondBooking.body.data.booking.bookingId });
  await request(app).post(`/api/payments/${firstPayment.body.payment.paymentId}/submit-utr`).send({
    utr: "998877665544",
    payerName: "Raj Patel",
  });
  const duplicate = await request(app)
    .post(`/api/payments/${secondPayment.body.payment.paymentId}/submit-utr`)
    .send({ utr: "998877665544", payerName: "Asha Shah" });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "DUPLICATE_UTR");
});

test("expires a payment session on the server", async () => {
  const created = await book(1);
  const payment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  await Payment.updateOne(
    { paymentReference: payment.body.payment.paymentId },
    { expiresAt: new Date(Date.now() - 1000) },
  );
  const response = await request(app).post(`/api/payments/${payment.body.payment.paymentId}/submit-utr`).send({
    utr: "112233445566",
    payerName: "Raj Patel",
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, "PAYMENT_EXPIRED");
  const booking = await Booking.findOne({ bookingId: created.body.data.booking.bookingId });
  assert.equal(booking.bookingStatus, "expired");
  const event = await Event.findOne({ eventId: "momnt-01" });
  assert.equal(event.bookedQuantity, 0);
});

test("returns payment and booking status", async () => {
  const created = await book(2);
  const payment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  await request(app).post(`/api/payments/${payment.body.payment.paymentId}/submit-utr`).send({
    utr: "556677889900",
    payerName: "Raj Patel",
  });
  const paymentView = await request(app).get(`/api/payments/${payment.body.payment.paymentId}`);
  const bookingView = await request(app).get(
    `/api/bookings/${created.body.data.booking.bookingId}/payment-status`,
  );
  assert.equal(paymentView.body.payment.status, "verification_pending");
  assert.equal(paymentView.body.payment.utr, undefined);
  assert.equal(bookingView.body.paymentStatus, "verification_pending");
  assert.equal(bookingView.body.bookingStatus, "payment_verification_pending");
  assert.equal(bookingView.body.amount, 6000);
});

test("verification marks a payment paid only through the service", async () => {
  const created = await book(1);
  const payment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  const paymentId = payment.body.payment.paymentId;
  await request(app).post(`/api/payments/${paymentId}/submit-utr`).send({
    utr: "121212121212",
    payerName: "Raj Patel",
  });
  const verified = await verifyPayment(paymentId);
  assert.equal(verified.status, "paid");
  const booking = await Booking.findOne({ bookingId: created.body.data.booking.bookingId });
  assert.equal(booking.bookingStatus, "confirmed");
  assert.equal(booking.paymentStatus, "paid");

  const second = await verifyPayment(paymentId).catch((error) => error);
  assert.equal(second.code, "PAYMENT_ALREADY_PAID");

  const again = await request(app).post("/api/payments/create").send({ bookingId: booking.bookingId });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, "BOOKING_ALREADY_PAID");
});

test("rejection keeps the booking payable and does not confirm it", async () => {
  const created = await book(1);
  const payment = await request(app)
    .post("/api/payments/create")
    .send({ bookingId: created.body.data.booking.bookingId });
  await request(app).post(`/api/payments/${payment.body.payment.paymentId}/submit-utr`).send({
    utr: "343434343434",
    payerName: "Raj Patel",
  });
  const rejected = await rejectPayment(payment.body.payment.paymentId, null, "Amount did not match the UPI statement.");
  assert.equal(rejected.status, "failed");
  const booking = await Booking.findOne({ bookingId: created.body.data.booking.bookingId });
  assert.equal(booking.bookingStatus, "payment_pending");
  assert.notEqual(booking.paymentStatus, "paid");
  const status = await request(app).get(`/api/bookings/${booking.bookingId}/payment-status`);
  assert.equal(status.body.paymentStatus, "failed");
  assert.match(status.body.rejectionReason, /UPI statement/);
});

test("admin verification routes are not public", async () => {
  const verify = await request(app).post("/api/admin/payments/PAY-20261004-0001/verify").send({ status: "paid" });
  const reject = await request(app).post("/api/admin/payments/PAY-20261004-0001/reject").send({ status: "paid" });
  const confirm = await request(app).post("/api/payments/confirm").send({ status: "paid" });
  assert.equal(verify.status, 401);
  assert.equal(reject.status, 401);
  assert.equal(confirm.status, 404);
});
