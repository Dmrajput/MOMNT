import { BOOKING_REF_KEY, BOOKING_STORAGE_KEY } from "../constants/booking";
import { clearStoredDraft } from "../utils/booking";
import { apiRequest } from "./apiClient";

function bookingRequestKey(eventId, quantity, email) {
  const fingerprint = `${eventId}|${quantity}|${email}`;
  const raw = sessionStorage.getItem("momnt_booking_idempotency");
  const saved = raw ? JSON.parse(raw) : null;
  if (saved?.fingerprint === fingerprint && saved.key) return saved.key;
  const key = crypto.randomUUID();
  sessionStorage.setItem("momnt_booking_idempotency", JSON.stringify({ fingerprint, key }));
  return key;
}

export async function createBooking(payload) {
  const key = bookingRequestKey(payload.event.id, payload.quantity, payload.customer.email);
  const result = await apiRequest("/bookings", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: {
      eventId: payload.event.id,
      quantity: payload.quantity,
      customer: {
        name: payload.customer.name,
        mobile: payload.customer.mobile,
        email: payload.customer.email,
      },
      guestNames: payload.guestNames || "",
    },
  });
  const booking = result.data.booking;
  const record = {
    bookingId: booking.bookingId,
    eventId: booking.eventId,
    eventName: booking.event?.title || payload.event.title,
    eventNumber: booking.event?.number || payload.event.number,
    quantity: booking.quantity,
    customer: booking.customer,
    attendees: payload.attendees || [],
    guestNames: payload.guestNames || "",
    subtotal: booking.subtotal,
    bookingFee: booking.bookingFee,
    total: booking.total,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    createdAt: booking.createdAt,
  };
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(record));
  localStorage.setItem(BOOKING_REF_KEY, booking.bookingId);
  sessionStorage.removeItem("momnt_booking_idempotency");
  clearStoredDraft();
  return record;
}
