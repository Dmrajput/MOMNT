import { recordAdminAudit } from "../utils/adminQuery.js";

export function auditAction(action, resourceType) {
  return function audit(req, res, next) {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      recordAdminAudit({
        adminId: req.admin?._id,
        action,
        resourceType,
        resourceId: req.params?.eventId || req.params?.bookingId || req.params?.paymentId || req.params?.ticketId || "",
        req,
      }).catch(() => {});
    });
    next();
  };
}
