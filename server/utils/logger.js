export function redact(value) {
  const text = String(value || "");
  if (/mongodb(\+srv)?:\/\//i.test(text) || /password|secret|authorization|cookie/i.test(text)) {
    return "redacted";
  }
  return text.slice(0, 240);
}

export function logEvent(level, fields) {
  const line = JSON.stringify({
    level,
    at: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(line);
  else console.info(line);
}

export function logStatusChange(fields) {
  logEvent("info", {
    event: "payment_status",
    paymentId: fields.paymentId,
    bookingId: fields.bookingId,
    previousStatus: fields.previousStatus,
    newStatus: fields.newStatus,
    action: fields.action,
  });
}
