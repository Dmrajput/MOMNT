import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    mobile: { type: String, required: true, trim: true, maxlength: 10 },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
