import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
import PaymentAuditLog from "../models/PaymentAuditLog.js";
import { getPaymentConfig } from "../config/payment.js";
import { DirectUPIProvider } from "./providers/directUpiProvider.js";
import { quoteBooking, releaseHold } from "./bookingService.js";
import { generateTicketForBooking } from "./ticketService.js";
import { AppError } from "../utils/errors.js";
import { generatePaymentId } from "../utils/generatePaymentId.js";
import { logStatusChange } from "../utils/logger.js";
import { withSession, withTransaction } from "../utils/transaction.js";
import {
  presentEvent,
  validateOptionalTransactionDate,
  validateOptionalUpiId,
  validatePayerName,
  validateUtr,
} from "../utils/validators.js";

const ACTIVE_STATUSES = ["pending", "payment_initiated", "verification_pending"];

function instructionsFor(payment) {
  const config = getPaymentConfig();
  const provider = new DirectUPIProvider(config);
  if (payment.status !== "payment_initiated" && payment.status !== "pending") {
    return {
      upiId: payment.upiId,
      upiName: config.upi.name,
      upiIntentUrl: undefined,
    };
  }
  return provider.createPayment({
    amount: payment.amount,
    bookingReference: payment.bookingReference,
  });
}

export function presentPayment(payment, event, { includeInstructions = false } = {}) {
  const instructions = includeInstructions ? instructionsFor(payment) : null;
  const body = {
    paymentId: payment.paymentReference,
    bookingId: payment.bookingReference,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    expiresAt: payment.expiresAt,
    submittedAt: payment.submittedAt,
  };
  if (event) body.event = presentEvent(event);
  if (instructions) {
    body.upiId = instructions.upiId;
    body.upiName = instructions.upiName;
    if (instructions.upiIntentUrl) body.upiIntentUrl = instructions.upiIntentUrl;
  }
  if (payment.status === "failed" && payment.rejectionReason) {
    body.rejectionReason = payment.rejectionReason;
  }
  return body;
}

async function writeAudit(payment, action, previousStatus, newStatus, session, extra = {}) {
  await PaymentAuditLog.create(
    [
      {
        paymentId: payment._id,
        action,
        previousStatus,
        newStatus,
        performedBy: extra.performedBy || null,
        metadata: extra.metadata || {},
      },
    ],
    withSession(session),
  );
  logStatusChange({
    paymentId: payment.paymentReference,
    bookingId: payment.bookingReference,
    previousStatus,
    newStatus,
    action,
  });
}

async function expirePaymentRecord(payment) {
  const updated = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: { $in: ["pending", "payment_initiated"] },
      expiresAt: { $lte: new Date() },
    },
    { status: "expired" },
    { new: true },
  );
  if (!updated) return null;

  const booking = await Booking.findById(updated.bookingId);
  if (
    booking &&
    booking.paymentStatus !== "paid" &&
    booking.paymentStatus !== "verification_pending" &&
    booking.bookingStatus !== "confirmed"
  ) {
    booking.paymentStatus = "expired";
    booking.bookingStatus = "expired";
    await booking.save();
    await releaseHold(booking);
  }
  await writeAudit(updated, "PAYMENT_EXPIRED", payment.status, "expired", null);
  return updated;
}

export async function expireStaleRecords() {
  const now = new Date();
  const stalePayments = await Payment.find({
    status: { $in: ["pending", "payment_initiated"] },
    expiresAt: { $lte: now },
  }).limit(50);
  for (const payment of stalePayments) {
    await expirePaymentRecord(payment);
  }

  const staleBookings = await Booking.find({
    bookingStatus: "payment_pending",
    paymentStatus: "pending",
    paymentId: null,
    holdReleased: false,
    paymentExpiresAt: { $lte: now },
  }).limit(50);
  for (const booking of staleBookings) {
    const closed = await Booking.findOneAndUpdate(
      { _id: booking._id, bookingStatus: "payment_pending", paymentStatus: "pending", holdReleased: false },
      { bookingStatus: "expired", paymentStatus: "expired" },
      { new: true },
    );
    if (closed) await releaseHold(closed);
  }
}

async function loadEvent(payment) {
  return Event.findById(payment.eventId);
}

async function assertAmount(booking) {
  const event = await Event.findById(booking.eventId);
  if (!event) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  const quote = quoteBooking(event, booking.quantity);
  if (quote.total !== booking.total) {
    throw new AppError("INVALID_AMOUNT", "The booking amount could not be verified.", 409);
  }
  return event;
}

export async function createPayment({ bookingReference, idempotencyKey }) {
  await expireStaleRecords();
  const booking = await Booking.findOne({ bookingId: bookingReference });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);

  if (booking.bookingStatus === "expired" || booking.paymentStatus === "expired") {
    throw new AppError("BOOKING_EXPIRED", "This booking has expired.", 409);
  }
  if (booking.paymentStatus === "paid" || booking.bookingStatus === "confirmed") {
    throw new AppError("BOOKING_ALREADY_PAID", "This booking is already paid.", 409);
  }
  if (booking.bookingStatus === "cancelled" || booking.paymentStatus === "cancelled") {
    throw new AppError("INVALID_PAYMENT_STATE", "This booking cannot be paid.", 409);
  }

  if (idempotencyKey) {
    const byKey = await Payment.findOne({ idempotencyKey });
    if (byKey) {
      const event = await loadEvent(byKey);
      return presentPayment(byKey, event, { includeInstructions: true });
    }
  }

  const active = await Payment.findOne({
    bookingId: booking._id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (active) {
    if (active.expiresAt <= new Date() && active.status !== "verification_pending") {
      await expirePaymentRecord(active);
      throw new AppError("PAYMENT_EXPIRED", "This payment session has expired.", 409);
    }
    const event = await loadEvent(active);
    return presentPayment(active, event, { includeInstructions: true });
  }

  const event = await assertAmount(booking);
  const config = getPaymentConfig();
  const provider = new DirectUPIProvider(config);
  const instructions = provider.createPayment({
    amount: booking.total,
    bookingReference: booking.bookingId,
  });
  const expiresAt = new Date(Date.now() + config.expiryMinutes * 60 * 1000);

  try {
    const payment = await withTransaction(async (session) => {
      let created = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const [record] = await Payment.create(
            [
              {
                bookingId: booking._id,
                bookingReference: booking.bookingId,
                paymentReference: generatePaymentId(),
                eventId: event._id,
                amount: booking.total,
                currency: "INR",
                method: "upi",
                status: "payment_initiated",
                upiId: instructions.upiId,
                expiresAt,
                idempotencyKey: idempotencyKey || undefined,
              },
            ],
            withSession(session),
          );
          created = record;
          break;
        } catch (error) {
          if (error?.code === 11000 && error?.keyPattern?.paymentReference) continue;
          throw error;
        }
      }
      if (!created) {
        throw new AppError("SERVER_ERROR", "Something went wrong. Please try again.", 500);
      }

      booking.paymentId = created._id;
      booking.paymentStatus = "payment_initiated";
      booking.bookingStatus = "payment_pending";
      booking.paymentExpiresAt = expiresAt;
      await booking.save(withSession(session));
      await writeAudit(created, "PAYMENT_CREATED", null, "payment_initiated", session, {
        metadata: { bookingId: booking.bookingId },
      });
      return created;
    });

    return presentPayment(payment, event, { includeInstructions: true });
  } catch (error) {
    if (error?.code === 11000) {
      const raced = await Payment.findOne({
        $or: [
          { bookingId: booking._id, status: { $in: ACTIVE_STATUSES } },
          ...(idempotencyKey ? [{ idempotencyKey }] : []),
        ],
      });
      if (raced) {
        const racedEvent = await loadEvent(raced);
        return presentPayment(raced, racedEvent, { includeInstructions: true });
      }
    }
    throw error;
  }
}

export async function submitUtr(paymentReference, input) {
  await expireStaleRecords();
  const checked = validateUtr(input?.utr);
  if (!checked.ok) {
    throw new AppError("INVALID_UTR", "Enter the UTR shown in your UPI transaction history.", 400);
  }
  const payerName = validatePayerName(input?.payerName);
  if (!payerName) {
    throw new AppError("VALIDATION_ERROR", "Please enter the payer name.", 400);
  }
  const payerUpi = validateOptionalUpiId(input?.payerUpiId);
  if (!payerUpi.ok) {
    throw new AppError("VALIDATION_ERROR", "Please check the payer UPI ID.", 400);
  }
  const transactionDate = validateOptionalTransactionDate(input?.transactionDate);
  if (!transactionDate.ok) {
    throw new AppError("VALIDATION_ERROR", "Please check the transaction date.", 400);
  }

  const payment = await Payment.findOne({ paymentReference });
  if (!payment) throw new AppError("PAYMENT_NOT_FOUND", "Payment session not found.", 404);

  if (payment.status === "paid") {
    throw new AppError("PAYMENT_ALREADY_PAID", "This payment is already confirmed.", 409);
  }
  if (payment.status === "verification_pending") {
    throw new AppError("PAYMENT_ALREADY_SUBMITTED", "Payment details have already been submitted.", 409);
  }
  if (payment.status === "expired") {
    throw new AppError("PAYMENT_EXPIRED", "This payment session has expired.", 409);
  }
  if (payment.status !== "payment_initiated" && payment.status !== "pending") {
    throw new AppError("INVALID_PAYMENT_STATE", "This payment can no longer be submitted.", 409);
  }
  if (payment.expiresAt <= new Date()) {
    await expirePaymentRecord(payment);
    throw new AppError("PAYMENT_EXPIRED", "This payment session has expired.", 409);
  }

  const duplicate = await Payment.findOne({ utr: checked.utr, _id: { $ne: payment._id } });
  if (duplicate) {
    throw new AppError("DUPLICATE_UTR", "This UTR has already been submitted.", 409);
  }

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  await assertAmount(booking);

  try {
    const updated = await withTransaction(async (session) => {
      const next = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          status: { $in: ["pending", "payment_initiated"] },
          expiresAt: { $gt: new Date() },
        },
        {
          utr: checked.utr,
          payerName,
          payerUpiId: payerUpi.value,
          transactionDate: transactionDate.value,
          submittedAt: new Date(),
          status: "verification_pending",
        },
        { new: true, ...withSession(session) },
      );
      if (!next) {
        throw new AppError("PAYMENT_ALREADY_SUBMITTED", "Payment details have already been submitted.", 409);
      }
      booking.paymentStatus = "verification_pending";
      booking.bookingStatus = "payment_verification_pending";
      await booking.save(withSession(session));
      await writeAudit(next, "UTR_SUBMITTED", payment.status, "verification_pending", session);
      return next;
    });
    return {
      paymentId: updated.paymentReference,
      bookingId: updated.bookingReference,
      status: updated.status,
      submittedAt: updated.submittedAt,
    };
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.utr) {
      throw new AppError("DUPLICATE_UTR", "This UTR has already been submitted.", 409);
    }
    throw error;
  }
}

export async function getPayment(paymentReference) {
  await expireStaleRecords();
  const payment = await Payment.findOne({ paymentReference });
  if (!payment) throw new AppError("PAYMENT_NOT_FOUND", "Payment session not found.", 404);
  const event = await loadEvent(payment);
  return presentPayment(payment, event, {
    includeInstructions: payment.status === "payment_initiated" || payment.status === "pending",
  });
}

export async function getBookingPaymentStatus(bookingReference) {
  await expireStaleRecords();
  const booking = await Booking.findOne({ bookingId: bookingReference });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  const event = await Event.findById(booking.eventId);
  let rejectionReason;
  if (booking.paymentId && booking.paymentStatus === "failed") {
    const payment = await Payment.findById(booking.paymentId).select("rejectionReason status");
    if (payment?.status === "failed") rejectionReason = payment.rejectionReason || undefined;
  }
  return {
    bookingId: booking.bookingId,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    amount: booking.total,
    currency: "INR",
    quantity: booking.quantity,
    event: event ? presentEvent(event) : undefined,
    rejectionReason,
  };
}

// Manual status change for a future admin who has already matched the UTR
// to the business UPI statement. This does not contact a bank or payment network.
export async function verifyPayment(paymentReference, adminId = null) {
  const payment = await Payment.findOne({ paymentReference });
  if (!payment) throw new AppError("PAYMENT_NOT_FOUND", "Payment session not found.", 404);
  if (payment.status === "paid") {
    throw new AppError("PAYMENT_ALREADY_PAID", "This payment is already confirmed.", 409);
  }
  if (payment.status !== "verification_pending") {
    throw new AppError("INVALID_PAYMENT_STATE", "Only a submitted payment can be verified.", 409);
  }

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  await assertAmount(booking);
  if (!payment.utr || payment.amount !== booking.total) {
    throw new AppError("INVALID_AMOUNT", "The booking amount could not be verified.", 409);
  }

  const updated = await withTransaction(async (session) => {
    const next = await Payment.findOneAndUpdate(
      { _id: payment._id, status: "verification_pending" },
      {
        status: "paid",
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
      { new: true, ...withSession(session) },
    );
    if (!next) {
      throw new AppError("INVALID_PAYMENT_STATE", "This payment can no longer be verified.", 409);
    }
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";
    await booking.save(withSession(session));
    await writeAudit(next, "PAYMENT_VERIFIED", "verification_pending", "paid", session, {
      performedBy: adminId,
      metadata: { manual: true },
    });
    return next;
  });

  await generateTicketForBooking(booking.bookingId);

  return {
    paymentId: updated.paymentReference,
    bookingId: updated.bookingReference,
    status: updated.status,
    verifiedAt: updated.verifiedAt,
  };
}

export async function rejectPayment(paymentReference, adminId = null, reason = "") {
  const payment = await Payment.findOne({ paymentReference });
  if (!payment) throw new AppError("PAYMENT_NOT_FOUND", "Payment session not found.", 404);
  if (payment.status !== "verification_pending") {
    throw new AppError("INVALID_PAYMENT_STATE", "Only a submitted payment can be rejected.", 409);
  }
  const safeReason = String(reason || "We couldn't verify this payment.").trim().slice(0, 180);

  const updated = await withTransaction(async (session) => {
    const next = await Payment.findOneAndUpdate(
      { _id: payment._id, status: "verification_pending" },
      { status: "failed", rejectionReason: safeReason, verifiedBy: adminId },
      { new: true, ...withSession(session) },
    );
    if (!next) {
      throw new AppError("INVALID_PAYMENT_STATE", "This payment can no longer be rejected.", 409);
    }
    const bookingQuery = Booking.findById(payment.bookingId);
    if (session) bookingQuery.session(session);
    const booking = await bookingQuery;
    if (booking) {
      booking.paymentStatus = "failed";
      booking.bookingStatus = "payment_pending";
      await booking.save(withSession(session));
    }
    await writeAudit(next, "PAYMENT_REJECTED", "verification_pending", "failed", session, {
      performedBy: adminId,
    });
    return next;
  });

  return {
    paymentId: updated.paymentReference,
    bookingId: updated.bookingReference,
    status: updated.status,
  };
}
