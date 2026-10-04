import QRCode from "qrcode";
import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import TicketAuditLog from "../models/TicketAuditLog.js";
import { ticketValidationUrl } from "../config/ticket.js";
import { AppError } from "../utils/errors.js";
import { hasEventEnded } from "../utils/eventWindow.js";
import { accessPrefix, generatePublicTicketId, generateQrToken } from "../utils/generateTicketId.js";
import { formatEventDate } from "../utils/validators.js";

const MESSAGES = {
  INVALID_QR_TOKEN: "This access code is not valid.",
  ALREADY_CHECKED_IN: "Already Checked In",
  TICKET_CANCELLED: "This MOMNT access is no longer valid.",
  TICKET_REFUNDED: "This ticket cannot be used for event entry.",
  TICKET_EXPIRED: "This MOMNT access has expired because the event has ended.",
  EVENT_ENDED: "This MOMNT access has expired because the event has ended.",
  TICKET_NOT_FOUND: "Your MOMNT access could not be found.",
  TICKET_NOT_AVAILABLE: "Your MOMNT access will be available after payment confirmation.",
  PAYMENT_NOT_CONFIRMED: "Your MOMNT access will be available after payment confirmation.",
  BOOKING_NOT_CONFIRMED: "Your MOMNT access will be available after payment confirmation.",
};

function messageFor(code) {
  return MESSAGES[code] || "This MOMNT access is not valid.";
}

function logTicket(action, ticket, previousStatus = null) {
  console.info(
    JSON.stringify({
      action,
      ticketId: ticket.ticketId,
      bookingId: ticket.bookingReference,
      previousStatus,
      newStatus: ticket.status,
      at: new Date().toISOString(),
    }),
  );
}

async function writeAudit(ticket, action, previousStatus, newStatus, performedBy = null, metadata = {}) {
  await TicketAuditLog.create({
    ticketId: ticket._id,
    action,
    previousStatus,
    newStatus,
    performedBy,
    metadata,
  });
  logTicket(action, ticket, previousStatus);
}

export function checkTicketEligibility(ticket, now = new Date()) {
  if (!ticket) return { allowed: false, code: "INVALID_QR_TOKEN" };
  if (ticket.status === "checked_in") return { allowed: false, code: "ALREADY_CHECKED_IN" };
  if (ticket.status === "cancelled") return { allowed: false, code: "TICKET_CANCELLED" };
  if (ticket.status === "refunded") return { allowed: false, code: "TICKET_REFUNDED" };
  if (ticket.status === "expired") return { allowed: false, code: "TICKET_EXPIRED" };
  if (ticket.status !== "active") return { allowed: false, code: "INVALID_QR_TOKEN" };
  if (hasEventEnded(ticket.eventSnapshot, now)) return { allowed: false, code: "EVENT_ENDED" };
  return { allowed: true, code: null };
}

export function effectiveStatus(ticket, now = new Date()) {
  if (ticket.status === "active" && hasEventEnded(ticket.eventSnapshot, now)) return "expired";
  return ticket.status;
}

export function presentTicket(ticket, now = new Date()) {
  const snapshot = ticket.eventSnapshot;
  return {
    ticketId: ticket.ticketId,
    ticketNumber: ticket.ticketNumber,
    bookingReference: ticket.bookingReference,
    event: {
      number: snapshot.eventNumber,
      title: snapshot.title,
      location: snapshot.location,
      date: formatEventDate(snapshot.date),
      time: `${snapshot.startTime} — ${snapshot.endTime}`,
      image: snapshot.image,
    },
    customer: {
      name: ticket.customer.name,
    },
    quantity: ticket.quantity,
    status: effectiveStatus(ticket, now),
    issuedAt: ticket.issuedAt,
    checkedInAt: ticket.checkedInAt,
  };
}

function presentValidationTicket(ticket, eligibility) {
  const view = {
    ticketId: ticket.ticketId,
    ticketNumber: ticket.ticketNumber,
    customerName: ticket.customer.name,
    quantity: ticket.quantity,
    event: ticket.eventSnapshot.title,
    eventName: ticket.eventSnapshot.title,
    eventDate: formatEventDate(ticket.eventSnapshot.date),
    status: eligibility.code === "EVENT_ENDED" ? "expired" : ticket.status,
  };
  if (ticket.checkedInAt) view.checkedInAt = ticket.checkedInAt;
  return view;
}

async function nextTicketNumber(prefix) {
  const counter = await Counter.findOneAndUpdate(
    { key: `ticket:${prefix}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `${prefix}-${String(counter.seq).padStart(4, "0")}`;
}

async function assertEligibleBooking(booking) {
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  if (booking.paymentStatus !== "paid") {
    throw new AppError("PAYMENT_NOT_CONFIRMED", messageFor("PAYMENT_NOT_CONFIRMED"), 409);
  }
  if (booking.bookingStatus !== "confirmed") {
    throw new AppError("BOOKING_NOT_CONFIRMED", messageFor("BOOKING_NOT_CONFIRMED"), 409);
  }
}

export async function generateTicketForBooking(bookingReference) {
  const booking = await Booking.findOne({ bookingId: bookingReference });
  await assertEligibleBooking(booking);

  const existing = await Ticket.findOne({ bookingId: booking._id });
  if (existing) return existing;

  const event = await Event.findById(booking.eventId);
  if (!event) throw new AppError("BOOKING_NOT_FOUND", "This experience is no longer available.", 404);

  const prefix = accessPrefix(event);
  const ticketNumber = await nextTicketNumber(prefix);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const ticket = await Ticket.create({
        ticketId: generatePublicTicketId(prefix),
        ticketNumber,
        bookingId: booking._id,
        bookingReference: booking.bookingId,
        eventId: event._id,
        customer: {
          name: booking.customer.name,
          email: booking.customer.email,
          mobile: booking.customer.mobile,
        },
        eventSnapshot: {
          eventNumber: event.number,
          title: event.title,
          location: event.location,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          image: event.image || "",
        },
        quantity: booking.quantity,
        status: "active",
        qrToken: generateQrToken(),
        qrVersion: 1,
        issuedAt: new Date(),
      });
      await writeAudit(ticket, "TICKET_CREATED", null, "active", null, { quantity: ticket.quantity });
      return ticket;
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const raced = await Ticket.findOne({ bookingId: booking._id });
      if (raced) return raced;
    }
  }

  throw new AppError("SERVER_ERROR", "Unable to issue MOMNT access. Please try again.", 500);
}

export async function getTicketByBooking(bookingReference) {
  const booking = await Booking.findOne({ bookingId: bookingReference });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  const ticket = await Ticket.findOne({ bookingId: booking._id });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", messageFor("TICKET_NOT_FOUND"), 404);
  return ticket;
}

export async function getTicketForCustomerBooking(bookingReference) {
  const booking = await Booking.findOne({ bookingId: bookingReference });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  if (booking.paymentStatus !== "paid" || booking.bookingStatus !== "confirmed") {
    throw new AppError("TICKET_NOT_AVAILABLE", messageFor("TICKET_NOT_AVAILABLE"), 409);
  }
  return generateTicketForBooking(booking.bookingId);
}

export async function getTicketById(ticketId, { audit = true } = {}) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", messageFor("TICKET_NOT_FOUND"), 404);
  if (audit) {
    await writeAudit(ticket, "TICKET_VIEWED", ticket.status, ticket.status);
  }
  return ticket;
}

export async function validateTicketToken(qrToken) {
  const ticket = await Ticket.findOne({ qrToken });
  if (!ticket) {
    return {
      success: true,
      valid: false,
      code: "INVALID_QR_TOKEN",
      message: messageFor("INVALID_QR_TOKEN"),
    };
  }

  const eligibility = checkTicketEligibility(ticket);
  await writeAudit(ticket, "TICKET_VALIDATED", ticket.status, ticket.status, null, {
    code: eligibility.allowed ? "VALID" : eligibility.code,
  });

  if (!eligibility.allowed) {
    return {
      success: true,
      valid: false,
      code: eligibility.code,
      message: messageFor(eligibility.code),
      ticket: presentValidationTicket(ticket, eligibility),
    };
  }

  return {
    success: true,
    valid: true,
    ticket: presentValidationTicket(ticket, eligibility),
  };
}

export async function renderTicketQr(ticket) {
  return QRCode.toBuffer(ticketValidationUrl(ticket.qrToken), {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 640,
    color: { dark: "#11111A", light: "#FFFFFF" },
  });
}

async function transitionTicket(ticketId, nextStatus, extra = {}, action, performedBy = null) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", messageFor("TICKET_NOT_FOUND"), 404);
  if (ticket.status === nextStatus) return ticket;
  const previous = ticket.status;
  Object.assign(ticket, extra, { status: nextStatus });
  await ticket.save();
  await writeAudit(ticket, action, previous, nextStatus, performedBy);
  return ticket;
}

export async function cancelTicket(ticketId, reason = "", performedBy = null) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", messageFor("TICKET_NOT_FOUND"), 404);
  if (ticket.status === "checked_in") {
    throw new AppError("TICKET_ALREADY_CHECKED_IN", "This access has already been used.", 409);
  }
  const safeReason = String(reason || "").trim().slice(0, 180) || null;
  return transitionTicket(
    ticketId,
    "cancelled",
    { cancelledAt: new Date(), cancellationReason: safeReason },
    "TICKET_CANCELLED",
    performedBy,
  );
}

export async function markTicketRefunded(ticketId, performedBy = null) {
  return transitionTicket(ticketId, "refunded", {}, "TICKET_REFUNDED", performedBy);
}

export async function expireTicket(ticketId) {
  return transitionTicket(ticketId, "expired", {}, "TICKET_EXPIRED");
}

export async function markTicketCheckedIn(ticketId, performedBy = null) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", messageFor("TICKET_NOT_FOUND"), 404);

  const eligibility = checkTicketEligibility(ticket);
  if (!eligibility.allowed) {
    throw new AppError(eligibility.code, messageFor(eligibility.code), 409);
  }

  const updated = await Ticket.findOneAndUpdate(
    { _id: ticket._id, status: "active" },
    { status: "checked_in", checkedInAt: new Date(), checkedInBy: performedBy },
    { new: true },
  );
  if (!updated) {
    throw new AppError("ALREADY_CHECKED_IN", messageFor("ALREADY_CHECKED_IN"), 409);
  }
  await writeAudit(updated, "TICKET_CHECKED_IN", "active", "checked_in", performedBy);
  return updated;
}
