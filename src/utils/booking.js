import {
  BOOKING_FEE,
  BOOKING_STORAGE_KEY,
  DRAFT_EXPIRY_MINUTES,
  DRAFT_STORAGE_KEY,
  MAX_PASSES_PER_BOOKING,
  MIN_PASSES,
} from "../constants/booking";

// IMPORTANT:
// Final price must always be recalculated and validated by the backend
// before payment in the production version.

export function getAvailablePasses(event) {
  return event?.capacity ?? 0;
}

export function passLimit(event) {
  const available = getAvailablePasses(event);
  if (!available) return 0;
  return Math.min(available, MAX_PASSES_PER_BOOKING);
}

export function clampQuantity(quantity, event) {
  const max = passLimit(event);
  const min = max > 0 ? MIN_PASSES : 0;
  const value = Number(quantity) || min;
  return Math.min(max, Math.max(min, value));
}

export function calculateSubtotal(price, quantity) {
  return Number(price) * Number(quantity);
}

export function calculateBookingFee() {
  return BOOKING_FEE;
}

export function calculateTotal(subtotal, bookingFee = calculateBookingFee()) {
  return subtotal + bookingFee;
}

export function generateBookingId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = String(date.getTime()).slice(-4);
  return `MOMNT-${year}${month}${day}-${suffix}`;
}

export function maskMobile(mobile) {
  const digits = String(mobile ?? "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return mobile || "";
  return `+91 ${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

export function isDraftExpired(updatedAt, now = Date.now()) {
  if (!updatedAt) return true;
  const saved = new Date(updatedAt).getTime();
  if (Number.isNaN(saved)) return true;
  return now - saved > DRAFT_EXPIRY_MINUTES * 60 * 1000;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readDraft() {
  return readJson(DRAFT_STORAGE_KEY);
}

export function saveDraft(draft) {
  writeJson(DRAFT_STORAGE_KEY, draft);
}

export function clearStoredDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function getStoredBooking() {
  return readJson(BOOKING_STORAGE_KEY);
}

export function clearStoredBooking() {
  localStorage.removeItem(BOOKING_STORAGE_KEY);
}

export function createLocalBooking({
  event,
  quantity,
  customer,
  attendees = [],
  guestNames = "",
}) {
  const subtotal = calculateSubtotal(event.price, quantity);
  const bookingFee = calculateBookingFee();
  const total = calculateTotal(subtotal, bookingFee);
  const createdAt = new Date().toISOString();
  const booking = {
    bookingId: generateBookingId(new Date()),
    eventId: event.id,
    eventName: event.title,
    eventNumber: event.number,
    quantity,
    customer: {
      name: customer.name.trim(),
      mobile: customer.mobile,
      email: customer.email.trim(),
    },
    attendees,
    guestNames,
    subtotal,
    bookingFee,
    total,
    paymentStatus: "pending",
    bookingStatus: "created",
    status: "payment_pending",
    createdAt,
  };
  writeJson(BOOKING_STORAGE_KEY, booking);
  return booking;
}
