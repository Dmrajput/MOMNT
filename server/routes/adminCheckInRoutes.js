import { Router } from "express";
import { z } from "zod";
import { postValidate, showCheckInStats } from "../controllers/adminCheckInController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listQuery, requestSchema } from "./adminSchemas.js";

const router = Router();
router.get(
  "/stats",
  adminAuth,
  requireAccess("check_in"),
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showCheckInStats),
);
router.post(
  "/validate",
  adminAuth,
  requireAccess("check_in"),
  requireCsrf,
  validateRequest(
    requestSchema({
      body: z
        .object({
          token: z.string().max(300).optional(),
          ticketId: z.string().max(80).optional(),
        })
        .strip(),
    }),
  ),
  asyncHandler(postValidate),
);

export default router;
