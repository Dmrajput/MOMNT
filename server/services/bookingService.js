import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
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

function canMemberCancel(booking) {
  if (!booking) return false;
  if (booking.paymentStatus === "paid" || booking.paymentStatus === "refunded") return false;
  if (["confirmed", "cancelled", "refunded"].includes(booking.bookingStatus)) return false;
  return true;
}

export async function listUserBookings(user) {
  const bookings = await Booking.find({ "customer.email": user.email }).sort({ createdAt: -1 }).limit(50);
  const events = await Event.find({ _id: { $in: bookings.map((booking) => booking.eventId) } });
  const eventsById = new Map(events.map((event) => [String(event._id), event]));
  return bookings.map((booking) => {
    const event = eventsById.get(String(booking.eventId));
    const view = event ? presentBooking(booking, event) : { bookingId: booking.bookingId, quantity: booking.quantity, total: booking.total, customer: booking.customer, bookingStatus: booking.bookingStatus, paymentStatus: booking.paymentStatus, createdAt: booking.createdAt };
    return {
      ...view,
      guestNames: booking.guestNames || "",
      canCancel: canMemberCancel(booking),
    };
  });
}

export async function cancelUserBooking(user, bookingId) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking || booking.customer.email !== user.email) {
    throw new AppError("NOT_FOUND", "Booking not found.", 404);
  }
  if (!canMemberCancel(booking)) {
    if (booking.bookingStatus === "cancelled") {
      const event = await Event.findById(booking.eventId);
      return { ...presentBooking(booking, event), guestNames: booking.guestNames || "", canCancel: false };
    }
    throw new AppError("BOOKING_LOCKED", "This booking is approved and cannot be cancelled.", 409);
  }

  await withTransaction(async (session) => {
    const current = session ? await Booking.findById(booking._id).session(session) : await Booking.findById(booking._id);
    if (!current || !canMemberCancel(current)) return;
    current.bookingStatus = "cancelled";
    current.paymentStatus = "cancelled";
    await current.save(session ? { session } : undefined);
    await releaseHold(current, session);
    if (current.paymentId) {
      await Payment.updateOne(
        { _id: current.paymentId, status: { $nin: ["paid", "refunded"] } },
        { status: "cancelled" },
        withSession(session),
      );
    }
  });

  const updated = await Booking.findById(booking._id);
  const event = await Event.findById(updated.eventId);
  return { ...presentBooking(updated, event), guestNames: updated.guestNames || "", canCancel: false };
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
