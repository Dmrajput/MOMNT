import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function secureCode(length) {
  const chars = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (chars.length < length) {
    const bytes = crypto.randomBytes(length * 2);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      chars.push(ALPHABET[byte % ALPHABET.length]);
      if (chars.length === length) break;
    }
  }
  return chars.join("");
}

export function generateQrToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function accessPrefix(event) {
  const match = String(event?.number || event?.eventId || "").match(/(\d+)/);
  const code = String(match ? Number(match[1]) : 1).padStart(2, "0");
  return `MOMNT-${code}`;
}

export function generatePublicTicketId(prefix) {
  return `${prefix}-${secureCode(6)}`;
}
