import { cancelAdminBooking, getAdminBooking, searchBookings } from "../services/adminBookingService.js";

export async function showBookings(req, res) {
  const result = await searchBookings(req.validated?.query || {});
  res.json({ success: true, ...result });
}

export async function showBooking(req, res) {
  res.json({ success: true, booking: await getAdminBooking(req.validated.params.bookingId, req.admin, req) });
}

export async function postCancelBooking(req, res) {
  res.json({ success: true, booking: await cancelAdminBooking(req.validated.params.bookingId, req.admin, req) });
}
