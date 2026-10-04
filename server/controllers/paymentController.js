import { createPayment, getPayment, submitUtr } from "../services/paymentService.js";

export async function postPayment(req, res) {
  const payment = await createPayment({
    bookingReference: req.validated.body.bookingId,
    idempotencyKey: req.get("Idempotency-Key") || undefined,
  });
  res.status(201).json({ success: true, payment });
}

export async function postUtr(req, res) {
  const payment = await submitUtr(req.validated.params.paymentId, req.validated.body);
  res.json({ success: true, payment });
}

export async function showPayment(req, res) {
  const payment = await getPayment(req.validated.params.paymentId);
  res.json({ success: true, payment });
}
