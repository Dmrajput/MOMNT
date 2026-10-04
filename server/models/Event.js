import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    number: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    bookedQuantity: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "sold_out", "cancelled", "completed", "archived"],
      default: "published",
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    inclusions: { type: [String], default: [] },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1 });

export default mongoose.model("Event", eventSchema);
