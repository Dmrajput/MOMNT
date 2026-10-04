import { Router } from "express";
import { postCancelTicket, postCheckIn, showTicket, showTickets } from "../controllers/adminTicketController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { empty, idParam, listQuery, requestSchema } from "./adminSchemas.js";

const router = Router();
router.get(
  "/",
  adminAuth,
  requireAccess("tickets"),
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showTickets),
);
router.get(
  "/:ticketId",
  adminAuth,
  requireAccess("tickets"),
  validateRequest(requestSchema({ params: idParam("ticketId") })),
  asyncHandler(showTicket),
);
router.post(
  "/:ticketId/cancel",
  adminAuth,
  requireAccess("tickets_cancel"),
  requireCsrf,
  validateRequest(requestSchema({ params: idParam("ticketId"), body: empty })),
  asyncHandler(postCancelTicket),
);
router.post(
  "/:ticketId/check-in",
  adminAuth,
  requireAccess("check_in"),
  requireCsrf,
  validateRequest(requestSchema({ params: idParam("ticketId"), body: empty })),
  asyncHandler(postCheckIn),
);

export default router;
