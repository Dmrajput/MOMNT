import { Router } from "express";
import { z } from "zod";
import {
  exportReport,
  patchProfile,
  postPassword,
  showCheckInReport,
  showEventReports,
  showOverview,
  showProfile,
  showRevenue,
  showIntegrity,
  showSettings,
} from "../controllers/adminReportController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listQuery, requestSchema } from "./adminSchemas.js";

const reportRouter = Router();
reportRouter.use(adminAuth);
reportRouter.get("/overview", requireAccess("reports"), validateRequest(requestSchema({ query: listQuery })), asyncHandler(showOverview));
reportRouter.get("/events", requireAccess("reports"), asyncHandler(showEventReports));
reportRouter.get("/revenue", requireAccess("payment_reports"), validateRequest(requestSchema({ query: listQuery })), asyncHandler(showRevenue));
reportRouter.get("/check-ins", requireAccess("reports", "check_in"), validateRequest(requestSchema({ query: listQuery })), asyncHandler(showCheckInReport));
reportRouter.get("/integrity", requireAccess("reports"), asyncHandler(showIntegrity));
reportRouter.get("/export", requireAccess("reports", "payment_reports"), validateRequest(requestSchema({ query: listQuery })), asyncHandler(exportReport));

const profileRouter = Router();
profileRouter.use(adminAuth, requireAccess("profile"));
profileRouter.get("/", asyncHandler(showProfile));
profileRouter.patch(
  "/",
  requireCsrf,
  validateRequest(requestSchema({ body: z.object({ name: z.string().max(80) }).strip() })),
  asyncHandler(patchProfile),
);
profileRouter.post(
  "/change-password",
  requireCsrf,
  validateRequest(
    requestSchema({
      body: z
        .object({
          currentPassword: z.string().min(1).max(128),
          newPassword: z.string().min(10).max(128),
          confirmPassword: z.string().min(10).max(128),
        })
        .strip(),
    }),
  ),
  asyncHandler(postPassword),
);

const settingsRouter = Router();
settingsRouter.get("/", adminAuth, requireAccess("settings"), asyncHandler(showSettings));

export { profileRouter, reportRouter, settingsRouter };
