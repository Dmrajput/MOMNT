import {
  getTicketById,
  getTicketForCustomerBooking,
  presentTicket,
  renderTicketQr,
  validateTicketToken,
} from "../services/ticketService.js";

export async function showTicket(req, res) {
  const ticket = await getTicketById(req.validated.params.ticketId);
  res.json({ success: true, ticket: presentTicket(ticket) });
}

export async function showBookingTicket(req, res) {
  const ticket = await getTicketForCustomerBooking(req.validated.params.bookingId);
  res.json({ success: true, ticket: presentTicket(ticket) });
}

export async function showTicketQr(req, res) {
  const ticket = await getTicketById(req.validated.params.ticketId, { audit: false });
  const png = await renderTicketQr(ticket);
  res.type("png");
  res.send(png);
}

export async function showValidation(req, res) {
  const result = await validateTicketToken(req.validated.params.qrToken);
  res.json(result);
}
