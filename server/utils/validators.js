const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTR_PATTERN = /^[A-Z0-9]{8,22}$/;
const UPI_ID_PATTERN = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;

export function normalizeMobile(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(0, 10);
}

export function normalizeUtr(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function validateUtr(value) {
  const utr = normalizeUtr(value);
  if (!UTR_PATTERN.test(utr)) return { ok: false, utr };
  if (/^(.)\1+$/.test(utr)) return { ok: false, utr };
  return { ok: true, utr };
}

export function validateCustomer(customer) {
  const name = String(customer?.name ?? "").trim().replace(/\s+/g, " ");
  const mobile = normalizeMobile(customer?.mobile);
  const email = String(customer?.email ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 80) return null;
  if (!/^[6-9]\d{9}$/.test(mobile)) return null;
  if (!EMAIL_PATTERN.test(email) || email.length > 120) return null;
  return { name, mobile, email };
}

export function validatePayerName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return "";
  return name;
}

export function validateOptionalUpiId(value) {
  if (value === undefined || value === null || String(value).trim() === "") return { ok: true, value: undefined };
  const upiId = String(value).trim();
  if (!UPI_ID_PATTERN.test(upiId)) return { ok: false, value: undefined };
  return { ok: true, value: upiId };
}

export function validateOptionalTransactionDate(value) {
  if (value === undefined || value === null || value === "") return { ok: true, value: undefined };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false, value: undefined };
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (date.getTime() > now + 5 * 60 * 1000) return { ok: false, value: undefined };
  if (now - date.getTime() > sevenDays) return { ok: false, value: undefined };
  return { ok: true, value: date };
}

export function formatEventDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function presentEvent(event) {
  return {
    eventId: event.eventId,
    slug: event.slug,
    number: event.number,
    title: event.title,
    location: event.location,
    date: formatEventDate(event.date),
    time: `${event.startTime} – ${event.endTime}`,
    image: event.image,
    price: event.price,
  };
}
