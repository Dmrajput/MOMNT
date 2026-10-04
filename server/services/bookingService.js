import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import { getPaymentConfig } from "../config/payment.js";
import { AppError } from "../utils/errors.js";
import { generateBookingId } from "../utils/generateBookingId.js";
import { withSession, withTransaction } from "../utils/transaction.js";
import { presentEvent, validateCustomer } from "../utils/validators.js";

export function quoteBooking(event, quantity) {
  const config = getPaymentConfig();
  const subtotal = event.price * quantity;
  const bookingFee = config.bookingFee;
  return { subtotal, bookingFee, total: subtotal + bookingFee };
}

function assertQuantity(event, quantity) {
  const config = getPaymentConfig();
  if (!Number.isInteger(quantity) || quantity < config.minPasses || quantity > config.maxPassesPerBooking) {
    throw new AppError("VALIDATION_ERROR", "Please choose a valid number of passes.", 400);
  }
  if (quantity > event.capacity) {
    throw new AppError("EVENT_SOLD_OUT", "This experience does not have enough passes left.", 409);
  }
}

export function presentBooking(booking, event) {
  return {
    bookingId: booking.bookingId,
    eventId: event.eventId,
    event: presentEvent(event),
    customer: {
      name: booking.customer.name,
      mobile: booking.customer.mobile,
      email: booking.customer.email,
    },
    quantity: booking.quantity,
    subtotal: booking.subtotal,
    bookingFee: booking.bookingFee,
    total: booking.total,
    currency: "INR",
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    paymentExpiresAt: booking.paymentExpiresAt,
    createdAt: booking.createdAt,
  };
}

async function reservePasses(event, quantity, session) {
  const reserved = await Event.findOneAndUpdate(
    {
      _id: event._id,
      status: "published",
      $expr: { $lte: ["$bookedQuantity", { $subtract: ["$capacity", quantity] }] },
    },
    { $inc: { bookedQuantity: quantity } },
    { new: true, ...withSession(session) },
  );
  if (!reserved) {
    throw new AppError("EVENT_SOLD_OUT", "This experience does not have enough passes left.", 409);
  }
  return reserved;
}

export async function createBooking({ eventId, quantity, customer, guestNames, idempotencyKey }) {
  const person = validateCustomer(customer);
  if (!person) {
    throw new AppError("VALIDATION_ERROR", "Please check the guest details and try again.", 400);
  }

  const passes = Number(quantity);
  const event = await Event.findOne({ eventId, status: "published" });
  if (!event) {
    throw new AppError("BOOKING_NOT_FOUND", "Experience not found.", 404);
  }
  assertQuantity(event, passes);

  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey });
    if (existing) {
      const existingEvent = await Event.findById(existing.eventId);
      return presentBooking(existing, existingEvent);
    }
  }

  const quote = quoteBooking(event, passes);
  const expiresAt = new Date(Date.now() + getPaymentConfig().expiryMinutes * 60 * 1000);
  const names = String(guestNames ?? "").trim().slice(0, 240);

  try {
    const booking = await withTransaction(async (session) => {
      await reservePasses(event, passes, session);
      let created = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const [record] = await Booking.create(
            [
              {
                bookingId: generateBookingId(),
                eventId: event._id,
                customer: person,
                guestNames: names,
                quantity: passes,
                subtotal: quote.subtotal,
                bookingFee: quote.bookingFee,
                total: quote.total,
                bookingStatus: "payment_pending",
                paymentStatus: "pending",
                paymentExpiresAt: expiresAt,
                idempotencyKey: idempotencyKey || undefined,
              },
            ],
            withSession(session),
          );
          created = record;
          break;
        } catch (error) {
          if (error?.code === 11000 && error?.keyPattern?.bookingId) continue;
          throw error;
        }
      }
      if (!created) {
        throw new AppError("SERVER_ERROR", "Something went wrong. Please try again.", 500);
      }
      return created;
    });
    return presentBooking(booking, event);
  } catch (error) {
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Booking.findOne({ idempotencyKey });
      if (existing) {
        const existingEvent = await Event.findById(existing.eventId);
        return presentBooking(existing, existingEvent);
      }
    }
    throw error;
  }
}

export async function releaseHold(booking, session) {
  if (!booking || booking.holdReleased) return booking;
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, holdReleased: false },
    { holdReleased: true },
    { new: true, ...withSession(session) },
  );
  if (!updated) return booking;
  await Event.updateOne(
    { _id: updated.eventId, bookedQuantity: { $gte: updated.quantity } },
    { $inc: { bookedQuantity: -updated.quantity } },
    withSession(session),
  );
  return updated;
}
