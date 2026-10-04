const BOOKING_FEE = 0;
const MIN_PASSES = 1;
const MAX_PASSES_PER_BOOKING = 4;

export function getPaymentConfig() {
  const expiryMinutes = Number(process.env.PAYMENT_EXPIRY_MINUTES);
  return {
    currency: "INR",
    bookingFee: BOOKING_FEE,
    minPasses: MIN_PASSES,
    maxPassesPerBooking: MAX_PASSES_PER_BOOKING,
    expiryMinutes: Number.isFinite(expiryMinutes) && expiryMinutes > 0 ? expiryMinutes : 30,
    methods: ["upi"],
    upi: {
      enabled: true,
      id: String(process.env.UPI_ID || "").trim(),
      name: String(process.env.UPI_NAME || "MOMNT").trim(),
      description: String(process.env.UPI_DESCRIPTION || "MOMNT Event Booking").trim(),
    },
  };
}
