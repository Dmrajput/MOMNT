import { Router } from "express";
import { postCancelBooking, showBooking, showBookings } from "../controllers/adminBookingController.js";
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
  requireAccess("bookings"),
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showBookings),
);
router.get(
  "/:bookingId",
  adminAuth,
  requireAccess("bookings"),
  validateRequest(requestSchema({ params: idParam("bookingId") })),
  asyncHandler(showBooking),
);
router.post(
  "/:bookingId/cancel",
  adminAuth,
  requireAccess("bookings_cancel"),
  requireCsrf,
  validateRequest(requestSchema({ params: idParam("bookingId"), body: empty })),
  asyncHandler(postCancelBooking),
);

export default router;
