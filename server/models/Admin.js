import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "PAYMENT_MANAGER", "CHECK_IN_MANAGER"],
      required: true,
    },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
  },
  { timestamps: true },
);

adminSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    return ret;
  },
});

export default mongoose.model("Admin", adminSchema);
