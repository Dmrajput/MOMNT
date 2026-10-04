export function ticketPublicBaseUrl() {
  const base = process.env.TICKET_PUBLIC_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173";
  return String(base).replace(/\/$/, "");
}

export function ticketValidationUrl(token) {
  return `${ticketPublicBaseUrl()}/ticket/validate/${token}`;
}
