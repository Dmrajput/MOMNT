import { markTicketCheckedIn, validateTicketToken } from "./ticketService.js";

// Validation and check-in stay separate. The public validate route never calls checkInTicket.
// The admin HTTP routes stay disabled until authenticated admin access exists.

export async function validateTicket(qrToken) {
  return validateTicketToken(qrToken);
}

export async function checkInTicket(ticketId, performedBy = null) {
  return markTicketCheckedIn(ticketId, performedBy);
}
