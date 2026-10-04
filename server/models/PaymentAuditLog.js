import mongoose from "mongoose";

const paymentAuditLogSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    action: {
      type: String,
      required: true,
      enum: [
        "PAYMENT_CREATED",
        "UTR_SUBMITTED",
        "PAYMENT_VERIFIED",
        "PAYMENT_REJECTED",
        "PAYMENT_EXPIRED",
        "PAYMENT_CANCELLED",
        "PAYMENT_REFUNDED",
      ],
    },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentAuditLogSchema.index({ paymentId: 1, createdAt: -1 });

export default mongoose.model("PaymentAuditLog", paymentAuditLogSchema);
