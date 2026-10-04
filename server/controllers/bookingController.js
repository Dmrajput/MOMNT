import { createBooking } from "../services/bookingService.js";
import { expireStaleRecords, getBookingPaymentStatus } from "../services/paymentService.js";

export async function postBooking(req, res) {
  await expireStaleRecords();
  const booking = await createBooking({
    eventId: req.validated.body.eventId,
    quantity: req.validated.body.quantity,
    customer: req.validated.body.customer,
    guestNames: req.validated.body.guestNames,
    idempotencyKey: req.get("Idempotency-Key") || undefined,
  });
  res.status(201).json({ success: true, data: { booking } });
}

export async function getPaymentStatus(req, res) {
  const status = await getBookingPaymentStatus(req.validated.params.bookingId);
  res.json({ success: true, ...status });
}
