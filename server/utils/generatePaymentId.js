import crypto from "node:crypto";

export function generatePaymentId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = String(crypto.randomInt(0, 10000)).padStart(4, "0");
  return `PAY-${year}${month}${day}-${suffix}`;
}
