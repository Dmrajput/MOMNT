export function buildUpiIntentUrl({ upiId, upiName, amount, bookingReference }) {
  const value = Number(amount);
  const formattedAmount = Number.isInteger(value) ? String(value) : value.toFixed(2);
  const params = new URLSearchParams({
    pa: upiId,
    pn: upiName,
    am: formattedAmount,
    cu: "INR",
    tn: bookingReference,
  });
  return `upi://pay?${params.toString()}`;
}
