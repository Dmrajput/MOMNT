import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
import PaymentAuditLog from "../models/PaymentAuditLog.js";
import Ticket from "../models/Ticket.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { dashboardStats } from "./adminDashboardService.js";
import { AppError } from "../utils/errors.js";
import { cleanSearch, escapeRegex, pageParams, pageResult, recordAdminAudit } from "../utils/adminQuery.js";
import { getPaymentConfig } from "../config/payment.js";
import { checkTicketEligibility, presentTicket } from "./ticketService.js";

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

async function resolveEvent(eventId) {
  if (!eventId) return null;
  const event = await Event.findOne({ eventId: String(eventId) });
  if (!event) throw new AppError("NOT_FOUND", "Event not found.", 404);
  return event;
}

export async function listPayments(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  const event = await resolveEvent(query.eventId);
  if (event) filter.eventId = event._id;
  if (PAYMENT_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.method === "upi") filter.method = "upi";
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  const term = cleanSearch(query.q);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ paymentReference: pattern }, { bookingReference: pattern }, { utr: term.toUpperCase() }];
  }
  const [total, rows] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  const bookings = await Booking.find({ _id: { $in: rows.map((row) => row.bookingId) } }).select("customer");
  const customers = new Map(bookings.map((booking) => [String(booking._id), booking.customer.name]));
  return {
    data: rows.map((payment) => ({
      paymentId: payment.paymentReference,
      bookingId: payment.bookingReference,
      customerName: customers.get(String(payment.bookingId)) || "",
      amount: payment.amount,
      method: payment.method,
      utr: payment.utr || "",
      status: payment.status,
      submittedAt: payment.submittedAt,
      createdAt: payment.createdAt,
    })),
    pagination: pageResult(page, limit, total),
  };
}

export async function getAdminPayment(paymentReference, admin, req) {
  const payment = await Payment.findOne({ paymentReference });
  if (!payment) throw new AppError("NOT_FOUND", "Payment not found.", 404);
  const booking = await Booking.findById(payment.bookingId);
  const [paymentLogs, adminLogs] = await Promise.all([
    PaymentAuditLog.find({ paymentId: payment._id }).sort({ createdAt: 1 }).limit(30),
    AdminAuditLog.find({ resourceType: "payment", resourceId: payment.paymentReference }).sort({ createdAt: 1 }).limit(30),
  ]);
  await recordAdminAudit({
    adminId: admin._id,
    action: "PAYMENT_VIEWED",
    resourceType: "payment",
    resourceId: payment.paymentReference,
    req,
  });
  return {
    paymentId: payment.paymentReference,
    bookingId: payment.bookingReference,
    customer: booking?.customer || null,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    upiId: payment.upiId,
    utr: payment.utr || "",
    payerName: payment.payerName || "",
    transactionDate: payment.transactionDate,
    submittedAt: payment.submittedAt,
    verifiedAt: payment.verifiedAt,
    status: payment.status,
    rejectionReason: payment.rejectionReason,
    activity: [
      ...paymentLogs.map((log) => ({
        at: log.createdAt,
        action: log.action,
        actor: "System",
      })),
      ...adminLogs.map((log) => ({
        at: log.createdAt,
        action: log.action,
        actor: "Admin",
      })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at)),
  };
}

export async function listTickets(query, { includeContact = false } = {}) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  const event = await resolveEvent(query.eventId);
  if (event) filter.eventId = event._id;
  if (["active", "checked_in", "cancelled", "refunded", "expired"].includes(query.status)) {
    filter.status = query.status;
  }
  const term = cleanSearch(query.q);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ ticketId: pattern }, { ticketNumber: pattern }, { bookingReference: pattern }, { "customer.name": pattern }];
  }
  const [total, rows] = await Promise.all([
    Ticket.countDocuments(filter),
    Ticket.find(filter).sort({ issuedAt: -1 }).skip(skip).limit(limit),
  ]);
  return {
    data: rows.map((ticket) => ({
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customer.name,
      ...(includeContact ? { email: ticket.customer.email, mobile: ticket.customer.mobile } : {}),
      event: ticket.eventSnapshot.eventNumber,
      quantity: ticket.quantity,
      status: ticket.status,
      issuedAt: ticket.issuedAt,
      checkedInAt: ticket.checkedInAt,
    })),
    pagination: pageResult(page, limit, total),
  };
}

export async function getAdminTicket(ticketId, admin, req, { includeContact = false } = {}) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new AppError("TICKET_NOT_FOUND", "Ticket not found.", 404);
  const logs = await AdminAuditLog.find({ resourceType: "ticket", resourceId: ticket.ticketId }).sort({ createdAt: 1 }).limit(30);
  await recordAdminAudit({
    adminId: admin._id,
    action: "TICKET_VIEWED",
    resourceType: "ticket",
    resourceId: ticket.ticketId,
    req,
  });
  const view = presentTicket(ticket);
  return {
    ...view,
    customer: includeContact ? ticket.customer : { name: ticket.customer.name },
    eligibility: checkTicketEligibility(ticket),
    activity: logs.map((log) => ({ at: log.createdAt, action: log.action })),
  };
}

export function reportRange(query) {
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const startToday = new Date(`${day}T00:00:00+05:30`);
  const preset = query.range || "upcoming";
  if (preset === "today") return { from: startToday, to: now };
  if (preset === "yesterday") {
    return { from: new Date(startToday.getTime() - 86400000), to: startToday };
  }
  if (preset === "7d") return { from: new Date(now.getTime() - 7 * 86400000), to: now };
  if (preset === "30d") return { from: new Date(now.getTime() - 30 * 86400000), to: now };
  if (preset === "month") return { from: new Date(`${day.slice(0, 7)}-01T00:00:00+05:30`), to: now };
  if (preset === "custom") {
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new AppError("VALIDATION_ERROR", "Choose a valid date range.", 400);
    }
    return { from, to };
  }
  return { from: null, to: null };
}

export async function reportOverview(query) {
  const event = await resolveEvent(query.eventId);
  const range = reportRange(query);
  const stats = await dashboardStats(event?._id || null);
  if (!range.from) return stats;
  const match = { createdAt: { $gte: range.from, $lte: range.to } };
  if (event) match.eventId = event._id;
  const [row] = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        bookings: { $sum: 1 },
        passes: { $sum: "$quantity" },
        grossRevenue: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$bookingStatus", "confirmed"] }] }, "$total", 0],
          },
        },
      },
    },
  ]);
  return { ...stats, rangeBookings: row?.bookings || 0, rangePasses: row?.passes || 0, rangeRevenue: row?.grossRevenue || 0 };
}

export async function eventPerformance() {
  const events = await Event.find().sort({ date: 1 });
  const rows = [];
  for (const event of events) {
    const stats = await dashboardStats(event._id);
    const [size] = await Booking.aggregate([
      { $match: { eventId: event._id, bookingStatus: "confirmed" } },
      { $group: { _id: null, bookings: { $sum: 1 }, passes: { $sum: "$quantity" } } },
    ]);
    rows.push({
      eventId: event.eventId,
      number: event.number,
      title: event.title,
      date: event.date,
      status: event.status,
      capacity: stats.capacity,
      passesSold: stats.bookedPasses,
      remaining: stats.remainingPasses,
      bookings: stats.totalBookings,
      confirmed: stats.confirmedBookings,
      cancelled: stats.cancelledBookings,
      revenue: stats.netRevenue,
      grossRevenue: stats.grossRevenue,
      pendingPayments: stats.pendingPayments,
      verificationPending: stats.verificationPending,
      checkedIn: stats.checkedInPasses,
      checkInRate: stats.checkInRate,
      averageBookingSize: size?.bookings ? Math.round((size.passes / size.bookings) * 10) / 10 : 0,
    });
  }
  return rows;
}

export function settingsView() {
  const payment = getPaymentConfig();
  return {
    businessName: process.env.BUSINESS_NAME || "MOMNT",
    businessEmail: process.env.BUSINESS_EMAIL || "",
    supportPhone: process.env.SUPPORT_PHONE || "",
    currency: "INR",
    upiDisplayName: payment.upi.name,
    paymentExpiryMinutes: payment.expiryMinutes,
    environment: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging" ? process.env.NODE_ENV : "development",
    version: "1.0.0",
  };
}

export function toCsv(rows) {
  if (!rows.length) return "message\nNo records\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((key) => {
          const value = row[key] == null ? "" : String(row[key]);
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
