import { apiRequest } from "./apiClient";

function paymentKey(bookingId) {
  return `momnt_payment_idempotency:${bookingId}`;
}

export function paymentIdempotencyKey(bookingId) {
  const existing = sessionStorage.getItem(paymentKey(bookingId));
  if (existing) return existing;
  const key = crypto.randomUUID();
  sessionStorage.setItem(paymentKey(bookingId), key);
  return key;
}

export function createPayment(bookingId, idempotencyKey = paymentIdempotencyKey(bookingId)) {
  return apiRequest("/payments/create", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: { bookingId },
  }).then((result) => result.payment);
}

export function submitUTR(paymentId, details) {
  return apiRequest(`/payments/${encodeURIComponent(paymentId)}/submit-utr`, {
    method: "POST",
    body: details,
  }).then((result) => result.payment);
}

export function getPayment(paymentId) {
  return apiRequest(`/payments/${encodeURIComponent(paymentId)}`).then((result) => result.payment);
}

export function getBookingPaymentStatus(bookingId) {
  return apiRequest(`/bookings/${encodeURIComponent(bookingId)}/payment-status`);
}
