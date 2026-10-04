import { Router } from "express";
import { showDashboard } from "../controllers/adminDashboardController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listQuery, requestSchema } from "./adminSchemas.js";

const router = Router();
router.get(
  "/",
  adminAuth,
  requireAccess("dashboard"),
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showDashboard),
);
export default router;
