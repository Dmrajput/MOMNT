import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
import Ticket from "../models/Ticket.js";
import { releaseHold } from "./bookingService.js";
import { AppError } from "../utils/errors.js";
import { cleanSearch, customerKey, escapeRegex, pageParams, pageResult, recordAdminAudit } from "../utils/adminQuery.js";
import { withTransaction } from "../utils/transaction.js";

const BOOKING_STATUSES = [
  "created",
  "payment_pending",
  "payment_verification_pending",
  "confirmed",
  "cancelled",
  "expired",
  "refunded",
];
const PAYMENT_STATUSES = [
  "pending",
  "payment_initiated",
  "verification_pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
  "refunded",
];

async function eventFilter(eventKey) {
  if (!eventKey) return null;
  const event = await Event.findOne({ eventId: String(eventKey) });
  if (!event) throw new AppError("NOT_FOUND", "Event not found.", 404);
  return event;
}

export async function searchBookings(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  const event = await eventFilter(query.eventId);
  if (event) filter.eventId = event._id;
  if (BOOKING_STATUSES.includes(query.bookingStatus)) filter.bookingStatus = query.bookingStatus;
  if (PAYMENT_STATUSES.includes(query.paymentStatus)) filter.paymentStatus = query.paymentStatus;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  const minAmount = Number(query.minAmount);
  const maxAmount = Number(query.maxAmount);
  if (Number.isFinite(minAmount) || Number.isFinite(maxAmount)) {
    filter.total = {};
    if (Number.isFinite(minAmount)) filter.total.$gte = minAmount;
    if (Number.isFinite(maxAmount)) filter.total.$lte = maxAmount;
  }

  const term = cleanSearch(query.q);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    const [tickets, payments] = await Promise.all([
      Ticket.find({ $or: [{ ticketId: pattern }, { ticketNumber: pattern }] }).select("bookingId"),
      Payment.find({ utr: term.toUpperCase() }).select("bookingId"),
    ]);
    const ids = [...tickets.map((item) => item.bookingId), ...payments.map((item) => item.bookingId)];
    filter.$or = [
      { bookingId: pattern },
      { "customer.name": pattern },
      { "customer.email": pattern },
      { "customer.mobile": pattern },
      ...(ids.length ? [{ _id: { $in: ids } }] : []),
    ];
  }

  const [total, rows] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  const events = await Event.find({ _id: { $in: rows.map((row) => row.eventId) } });
  const names = new Map(events.map((item) => [String(item._id), item]));
  return {
    data: rows.map((booking) => ({
      bookingId: booking.bookingId,
      customerName: booking.customer.name,
      email: booking.customer.email,
      mobile: booking.customer.mobile,
      event: names.get(String(booking.eventId))?.number || "",
      eventId: names.get(String(booking.eventId))?.eventId || "",
      quantity: booking.quantity,
      total: booking.total,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
    })),
    pagination: pageResult(page, limit, total),
  };
}

export async function getAdminBooking(bookingId, admin, req) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) throw new AppError("NOT_FOUND", "Booking not found.", 404);
  const [event, payment, ticket] = await Promise.all([
    Event.findById(booking.eventId),
    booking.paymentId ? Payment.findById(booking.paymentId) : Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 }),
    Ticket.findOne({ bookingId: booking._id }),
  ]);
  await recordAdminAudit({
    adminId: admin._id,
    action: "BOOKING_VIEWED",
    resourceType: "booking",
    resourceId: booking.bookingId,
    req,
  });
  return {
    bookingId: booking.bookingId,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    customer: booking.customer,
    event: event
      ? {
          eventId: event.eventId,
          number: event.number,
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
        }
      : null,
    quantity: booking.quantity,
    subtotal: booking.subtotal,
    bookingFee: booking.bookingFee,
    total: booking.total,
    currency: "INR",
    payment: payment
      ? {
          paymentId: payment.paymentReference,
          status: payment.status,
          amount: payment.amount,
          method: payment.method,
          utr: payment.utr || "",
          submittedAt: payment.submittedAt,
          verifiedAt: payment.verifiedAt,
          rejectionReason: payment.rejectionReason,
        }
      : null,
    ticket: ticket
      ? {
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          issuedAt: ticket.issuedAt,
          checkedInAt: ticket.checkedInAt,
        }
      : null,
  };
}

export async function cancelAdminBooking(bookingId, admin, req) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) throw new AppError("NOT_FOUND", "Booking not found.", 404);
  if (booking.bookingStatus === "cancelled") return { bookingId, bookingStatus: "cancelled" };
  const previous = booking.bookingStatus;

  await withTransaction(async (session) => {
    const current = session ? await Booking.findById(booking._id).session(session) : await Booking.findById(booking._id);
    if (!current || current.bookingStatus === "cancelled") return;
    current.bookingStatus = "cancelled";
    if (current.paymentStatus !== "paid" && current.paymentStatus !== "refunded") {
      current.paymentStatus = "cancelled";
    }
    await current.save(session ? { session } : undefined);
    await releaseHold(current, session);
    if (current.paymentId && current.paymentStatus === "cancelled") {
      await Payment.updateOne(
        { _id: current.paymentId, status: { $ne: "paid" } },
        { status: "cancelled" },
        session ? { session } : undefined,
      );
    }
  });

  const ticket = await Ticket.findOne({ bookingId: booking._id, status: "active" });
  if (ticket) {
    const { cancelTicket } = await import("./ticketService.js");
    await cancelTicket(ticket.ticketId, "Booking cancelled", admin._id);
  }
  await recordAdminAudit({
    adminId: admin._id,
    action: "BOOKING_CANCELLED",
    resourceType: "booking",
    resourceId: bookingId,
    previousValue: { bookingStatus: previous },
    newValue: { bookingStatus: "cancelled" },
    req,
  });
  return { bookingId, bookingStatus: "cancelled" };
}

export async function listCustomers(query) {
  const { page, limit, skip } = pageParams(query);
  const term = cleanSearch(query.q);
  const match = {};
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    match.$or = [
      { "customer.name": pattern },
      { "customer.email": pattern },
      { "customer.mobile": pattern },
      { bookingId: pattern },
    ];
  }
  const grouped = await Booking.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $toLower: "$customer.email" },
        name: { $first: "$customer.name" },
        mobile: { $first: "$customer.mobile" },
        bookings: { $sum: 1 },
        passes: { $sum: "$quantity" },
        paid: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$bookingStatus", "confirmed"] }] }, "$total", 0],
          },
        },
        lastBookingAt: { $first: "$createdAt" },
      },
    },
    { $sort: { lastBookingAt: -1 } },
  ]);
  const slice = grouped.slice(skip, skip + limit);
  return {
    data: slice.map((row) => ({
      customerId: customerKey(row._id),
      name: row.name,
      email: row.email || row._id,
      mobile: row.mobile,
      bookings: row.bookings,
      passes: row.passes,
      paid: row.paid,
      lastBookingAt: row.lastBookingAt,
    })),
    pagination: pageResult(page, limit, grouped.length),
  };
}

export async function getCustomer(customerId) {
  const rows = await Booking.find().sort({ createdAt: -1 });
  const email = rows.find((row) => customerKey(row.customer.email) === customerId)?.customer.email;
  if (!email) throw new AppError("NOT_FOUND", "Customer not found.", 404);
  const bookings = rows.filter((row) => row.customer.email === email);
  const events = await Event.find({ _id: { $in: bookings.map((row) => row.eventId) } });
  const names = new Map(events.map((event) => [String(event._id), event.number]));
  const tickets = await Ticket.find({ bookingId: { $in: bookings.map((row) => row._id) } });
  const person = bookings[0].customer;
  return {
    customerId,
    name: person.name,
    email: person.email,
    mobile: person.mobile,
    bookings: bookings.map((booking) => ({
      bookingId: booking.bookingId,
      event: names.get(String(booking.eventId)) || "",
      quantity: booking.quantity,
      total: booking.total,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
    })),
    tickets: tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      event: ticket.eventSnapshot.eventNumber,
      status: ticket.status,
      quantity: ticket.quantity,
    })),
  };
}
