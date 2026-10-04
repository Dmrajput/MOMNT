export function logStatusChange({ paymentId, bookingId, previousStatus, newStatus, action }) {
  console.info(
    JSON.stringify({
      paymentId,
      bookingId,
      previousStatus: previousStatus || null,
      newStatus,
      action,
      at: new Date().toISOString(),
    }),
  );
}
