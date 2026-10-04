import mongoose from "mongoose";

const ticketAuditLogSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
  action: { type: String, required: true },
  previousStatus: { type: String, default: null },
  newStatus: { type: String, default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("TicketAuditLog", ticketAuditLogSchema);
