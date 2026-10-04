import { Router } from "express";
import {
  patchEvent,
  postCancelEvent,
  postDuplicateEvent,
  postEvent,
  showEvent,
  showEvents,
} from "../controllers/adminEventController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { empty, eventBody, idParam, requestSchema } from "./adminSchemas.js";

const router = Router();
const read = [adminAuth, requireAccess("events", "bookings", "payments", "tickets", "check_in")];
const write = [adminAuth, requireAccess("events"), requireAccess("events_write"), requireCsrf];

router.get("/", ...read, asyncHandler(showEvents));
router.post("/", ...write, validateRequest(requestSchema({ body: eventBody })), asyncHandler(postEvent));
router.get("/:eventId", adminAuth, requireAccess("events"), validateRequest(requestSchema({ params: idParam("eventId") })), asyncHandler(showEvent));
router.patch(
  "/:eventId",
  ...write,
  validateRequest(requestSchema({ params: idParam("eventId"), body: eventBody })),
  asyncHandler(patchEvent),
);
router.post(
  "/:eventId/cancel",
  adminAuth,
  requireAccess("events_cancel"),
  requireCsrf,
  validateRequest(requestSchema({ params: idParam("eventId"), body: empty })),
  asyncHandler(postCancelEvent),
);
router.post(
  "/:eventId/duplicate",
  ...write,
  validateRequest(requestSchema({ params: idParam("eventId"), body: empty })),
  asyncHandler(postDuplicateEvent),
);

export default router;
