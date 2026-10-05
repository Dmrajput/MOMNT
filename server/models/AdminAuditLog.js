import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, default: "" },
  resourceId: { type: String, default: "" },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: true },
});

adminAuditLogSchema.index({ resourceId: 1, createdAt: -1 });

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);
