import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
import Ticket from "../models/Ticket.js";

function eventMatch(eventObjectId) {
  return eventObjectId ? { eventId: eventObjectId } : {};
}

function sumCond(condition, value = 1) {
  return { $sum: { $cond: [condition, value, 0] } };
}

export async function dashboardStats(eventObjectId = null) {
  const match = eventMatch(eventObjectId);
  const paidConfirmed = {
    $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$bookingStatus", "confirmed"] }],
  };
  const [bookingRow] = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        confirmedBookings: sumCond({ $eq: ["$bookingStatus", "confirmed"] }),
        cancelledBookings: sumCond({ $eq: ["$bookingStatus", "cancelled"] }),
        heldPasses: sumCond(
          { $and: [{ $eq: ["$holdReleased", false] }, { $ne: ["$bookingStatus", "cancelled"] }] },
          "$quantity",
        ),
        grossRevenue: sumCond(paidConfirmed, "$total"),
        refundedRevenue: sumCond({ $eq: ["$paymentStatus", "refunded"] }, "$total"),
      },
    },
  ]);
  const [paymentRow] = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        pendingPayments: sumCond({ $in: ["$status", ["pending", "payment_initiated"]] }),
        verificationPending: sumCond({ $eq: ["$status", "verification_pending"] }),
        paidPayments: sumCond({ $eq: ["$status", "paid"] }),
        failedPayments: sumCond({ $eq: ["$status", "failed"] }),
      },
    },
  ]);
  const [ticketRow] = await Ticket.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        ticketsIssued: { $sum: 1 },
        passesIssued: { $sum: "$quantity" },
        checkedInTickets: sumCond({ $eq: ["$status", "checked_in"] }),
        checkedInPasses: sumCond({ $eq: ["$status", "checked_in"] }, "$quantity"),
        activeTickets: sumCond({ $eq: ["$status", "active"] }),
        cancelledTickets: sumCond({ $eq: ["$status", "cancelled"] }),
      },
    },
  ]);

  const events = await Event.find(eventObjectId ? { _id: eventObjectId } : {}).select(
    "capacity bookedQuantity status",
  );
  const capacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const bookedPasses = events.reduce((sum, event) => sum + event.bookedQuantity, 0);
  const bookings = bookingRow || {};
  const payments = paymentRow || {};
  const tickets = ticketRow || {};
  const grossRevenue = bookings.grossRevenue || 0;
  const refundedRevenue = bookings.refundedRevenue || 0;
  const issued = tickets.passesIssued || 0;
  const checkedInPasses = tickets.checkedInPasses || 0;

  return {
    totalEvents: eventObjectId ? 1 : await Event.countDocuments(),
    upcomingEvents: await Event.countDocuments({
      ...(eventObjectId ? { _id: eventObjectId } : {}),
      status: "published",
      date: { $gte: new Date() },
    }),
    totalBookings: bookings.totalBookings || 0,
    confirmedBookings: bookings.confirmedBookings || 0,
    cancelledBookings: bookings.cancelledBookings || 0,
    pendingPayments: (payments.pendingPayments || 0) + (payments.verificationPending || 0),
    verificationPending: payments.verificationPending || 0,
    capacity,
    bookedPasses,
    remainingPasses: Math.max(0, capacity - bookedPasses),
    grossRevenue,
    refundedRevenue,
    netRevenue: grossRevenue - refundedRevenue,
    ticketsIssued: tickets.ticketsIssued || 0,
    checkedIn: tickets.checkedInTickets || 0,
    checkedInPasses,
    checkInRate: issued ? Math.round((checkedInPasses / issued) * 100) : 0,
    activeTickets: tickets.activeTickets || 0,
    cancelledTickets: tickets.cancelledTickets || 0,
    failedPayments: payments.failedPayments || 0,
    paidPayments: payments.paidPayments || 0,
  };
}

export async function recentActivity(eventObjectId = null) {
  const match = eventMatch(eventObjectId);
  const [bookings, payments, verifications, checkIns] = await Promise.all([
    Booking.find(match).sort({ createdAt: -1 }).limit(5),
    Payment.find({ ...match, status: "verification_pending" }).sort({ submittedAt: -1 }).limit(5),
    Payment.find({ ...match, status: "paid" }).sort({ verifiedAt: -1 }).limit(5),
    Ticket.find({ ...match, status: "checked_in" }).sort({ checkedInAt: -1 }).limit(5),
  ]);
  const events = await Event.find({ _id: { $in: bookings.map((item) => item.eventId) } });
  const eventName = new Map(events.map((event) => [String(event._id), event.number]));
  return {
    bookings: bookings.map((booking) => ({
      bookingId: booking.bookingId,
      customerName: booking.customer.name,
      event: eventName.get(String(booking.eventId)) || "",
      quantity: booking.quantity,
      total: booking.total,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    })),
    paymentSubmissions: payments.map(compactPayment),
    paymentVerifications: verifications.map(compactPayment),
    checkIns: checkIns.map((ticket) => ({
      ticketId: ticket.ticketId,
      customerName: ticket.customer.name,
      quantity: ticket.quantity,
      checkedInAt: ticket.checkedInAt,
    })),
  };
}

function compactPayment(payment) {
  return {
    paymentId: payment.paymentReference,
    bookingId: payment.bookingReference,
    amount: payment.amount,
    status: payment.status,
    submittedAt: payment.submittedAt,
    verifiedAt: payment.verifiedAt,
  };
}

export async function seriesFor(eventObjectId = null, days = 14) {
  const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const match = { createdAt: { $gte: start }, ...eventMatch(eventObjectId) };
  const rows = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
        bookings: { $sum: 1 },
        revenue: sumCond(
          { $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$bookingStatus", "confirmed"] }] },
          "$total",
        ),
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const paymentRows = await Payment.aggregate([
    { $match: eventMatch(eventObjectId) },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return {
    bookingsOverTime: rows.map((row) => ({ date: row._id, bookings: row.bookings, revenue: row.revenue })),
    paymentStatus: paymentRows.map((row) => ({ status: row._id, count: row.count })),
  };
}
