import { getAdminPayment, listPayments } from "../services/adminReportService.js";
import { rejectPayment, verifyPayment } from "../services/paymentService.js";
import { recordAdminAudit } from "../utils/adminQuery.js";
import { AppError } from "../utils/errors.js";

const REASONS = new Set([
  "UTR not found",
  "Incorrect amount",
  "Duplicate transaction",
  "Wrong account",
  "Suspicious payment",
  "Other",
]);

export async function showPayments(req, res) {
  const result = await listPayments(req.validated?.query || {});
  res.json({ success: true, ...result });
}

export async function showPayment(req, res) {
  res.json({ success: true, payment: await getAdminPayment(req.validated.params.paymentId, req.admin, req) });
}

export async function postVerifyPayment(req, res) {
  const result = await verifyPayment(req.validated.params.paymentId, req.admin._id);
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "PAYMENT_VERIFIED",
    resourceType: "payment",
    resourceId: result.paymentId,
    newValue: { status: "paid", bookingId: result.bookingId },
    req,
  });
  res.json({ success: true, payment: result });
}

export async function postRejectPayment(req, res) {
  const reason = String(req.validated.body.reason || "").trim();
  const detail = String(req.validated.body.detail || "").trim();
  const text = reason === "Other" ? detail : reason;
  if (!REASONS.has(reason) || text.length < 3) {
    throw new AppError("VALIDATION_ERROR", "Choose a rejection reason.", 400);
  }
  const result = await rejectPayment(req.validated.params.paymentId, req.admin._id, text.slice(0, 180));
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "PAYMENT_REJECTED",
    resourceType: "payment",
    resourceId: result.paymentId,
    newValue: { status: "failed" },
    req,
  });
  res.json({ success: true, payment: result });
}
