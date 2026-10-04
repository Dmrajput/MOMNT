import mongoose from "mongoose";

const ACTIVE_STATUSES = ["pending", "payment_initiated", "verification_pending"];

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    bookingReference: { type: String, required: true, trim: true },
    paymentReference: { type: String, required: true, unique: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: ["upi"], default: "upi" },
    status: {
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
    upiId: { type: String, required: true },
    utr: { type: String },
    payerName: { type: String, default: "" },
    payerUpiId: { type: String },
    transactionDate: { type: Date },
    paymentScreenshot: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    rejectionReason: { type: String, default: null },
    notes: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    idempotencyKey: { type: String },
  },
  { timestamps: true },
);

paymentSchema.index({ bookingReference: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ expiresAt: 1 });
paymentSchema.index({ utr: 1 }, { unique: true, sparse: true });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index(
  { bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_STATUSES } },
  },
);

export default mongoose.model("Payment", paymentSchema);
