import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    customer: {
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    guestNames: { type: String, default: "", maxlength: 240 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    bookingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    bookingStatus: {
      type: String,
      enum: [
        "created",
        "payment_pending",
        "payment_verification_pending",
        "confirmed",
        "cancelled",
        "expired",
        "refunded",
      ],
      default: "payment_pending",
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "payment_initiated",
        "verification_pending",
        "paid",
        "failed",
        "expired",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    paymentExpiresAt: { type: Date, default: null },
    holdReleased: { type: Boolean, default: false },
    idempotencyKey: { type: String, trim: true },
  },
  { timestamps: true },
);

bookingSchema.index({ eventId: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model("Booking", bookingSchema);
