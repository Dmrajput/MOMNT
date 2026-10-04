import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Admin from "../models/Admin.js";
import { dashboardStats } from "../services/adminDashboardService.js";
import { validateTicketToken, checkTicketEligibility, presentTicket } from "../services/ticketService.js";
import { recordAdminAudit } from "../utils/adminQuery.js";
import { AppError } from "../utils/errors.js";

function tokenFromInput(value) {
  const text = String(value || "").trim();
  const match = text.match(/\/ticket\/validate\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : text;
}

export async function postValidate(req, res) {
  const token = tokenFromInput(req.validated.body.token);
  const ticketId = String(req.validated.body.ticketId || "").trim();
  let result;
  if (ticketId) {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      result = { success: true, valid: false, code: "INVALID_QR_TOKEN", message: "This access code is not valid." };
    } else {
      const eligibility = checkTicketEligibility(ticket);
      const view = presentTicket(ticket);
      result = {
        success: true,
        valid: eligibility.allowed,
        code: eligibility.code,
        ticket: {
          ticketId: view.ticketId,
          ticketNumber: view.ticketNumber,
          customerName: view.customer.name,
          quantity: view.quantity,
          event: view.event.title,
          eventDate: view.event.date,
          status: view.status,
          checkedInAt: view.checkedInAt,
        },
      };
    }
  } else if (token) {
    result = await validateTicketToken(token);
  } else {
    throw new AppError("VALIDATION_ERROR", "Enter a ticket or scan a QR code.", 400);
  }
  if (result.code === "ALREADY_CHECKED_IN" && result.ticket?.ticketId) {
    const existing = await Ticket.findOne({ ticketId: result.ticket.ticketId }).select("checkedInBy");
    if (existing?.checkedInBy) {
      const staff = await Admin.findById(existing.checkedInBy).select("name");
      result.ticket.checkedInByName = staff?.name || "Staff";
    }
  }
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "CHECK_IN_VALIDATED",
    resourceType: "ticket",
    resourceId: result.ticket?.ticketId || "",
    newValue: { valid: Boolean(result.valid), code: result.code || "VALID" },
    req,
  });
  res.json(result);
}

export async function showCheckInStats(req, res) {
  const event = req.validated?.query?.eventId
    ? await Event.findOne({ eventId: String(req.validated.query.eventId) })
    : null;
  const stats = await dashboardStats(event?._id || null);
  const recent = await Ticket.find({ ...(event ? { eventId: event._id } : {}), status: "checked_in" })
    .sort({ checkedInAt: -1 })
    .limit(8);
  res.json({
    success: true,
    stats: {
      capacity: stats.capacity,
      passesIssued: stats.bookedPasses,
      checkedInPasses: stats.checkedInPasses,
      remaining: Math.max(0, stats.bookedPasses - stats.checkedInPasses),
      checkInRate: stats.checkInRate,
    },
    recent: recent.map((ticket) => ({
      ticketId: ticket.ticketId,
      customerName: ticket.customer.name,
      quantity: ticket.quantity,
      checkedInAt: ticket.checkedInAt,
    })),
  });
}
