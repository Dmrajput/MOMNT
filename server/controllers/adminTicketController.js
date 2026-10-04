import { accessFor } from "../utils/permissions.js";
import { getAdminTicket, listTickets } from "../services/adminReportService.js";
import { cancelTicket } from "../services/ticketService.js";
import { checkInTicket } from "../services/checkInService.js";
import { recordAdminAudit } from "../utils/adminQuery.js";

function canSeeContact(admin) {
  return accessFor(admin.role).includes("customers");
}

export async function showTickets(req, res) {
  const result = await listTickets(req.validated?.query || {}, { includeContact: canSeeContact(req.admin) });
  res.json({ success: true, ...result });
}

export async function showTicket(req, res) {
  const ticket = await getAdminTicket(req.validated.params.ticketId, req.admin, req, {
    includeContact: canSeeContact(req.admin),
  });
  res.json({ success: true, ticket });
}

export async function postCancelTicket(req, res) {
  const reason = String(req.body?.reason || "Cancelled by admin").slice(0, 180);
  const ticket = await cancelTicket(req.validated.params.ticketId, reason, req.admin._id);
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "TICKET_CANCELLED",
    resourceType: "ticket",
    resourceId: ticket.ticketId,
    newValue: { status: "cancelled" },
    req,
  });
  res.json({ success: true, ticketId: ticket.ticketId, status: ticket.status });
}

export async function postCheckIn(req, res) {
  const ticket = await checkInTicket(req.validated.params.ticketId, req.admin._id);
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "CHECK_IN_COMPLETED",
    resourceType: "ticket",
    resourceId: ticket.ticketId,
    previousValue: { status: "active" },
    newValue: { status: "checked_in", eventId: String(ticket.eventId) },
    req,
  });
  res.json({
    success: true,
    ticket: {
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customer.name,
      quantity: ticket.quantity,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt,
    },
  });
}
