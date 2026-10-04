import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, trim: true },
    ticketNumber: { type: String, required: true, unique: true, trim: true },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    bookingReference: { type: String, required: true, unique: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      mobile: { type: String, required: true, trim: true },
    },
    eventSnapshot: {
      eventNumber: { type: String, required: true },
      title: { type: String, required: true },
      location: { type: String, required: true },
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      image: { type: String, default: "" },
    },
    quantity: { type: Number, required: true, min: 1, max: 4 },
    status: {
      type: String,
      enum: ["active", "checked_in", "cancelled", "refunded", "expired"],
      default: "active",
      index: true,
    },
    qrToken: { type: String, required: true, unique: true },
    qrVersion: { type: Number, default: 1 },
    issuedAt: { type: Date, required: true },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
