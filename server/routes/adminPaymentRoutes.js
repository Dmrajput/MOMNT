import { Router } from "express";
import { z } from "zod";
import { postRejectPayment, postVerifyPayment, showPayment, showPayments } from "../controllers/adminPaymentController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAccess } from "../middleware/requireRole.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { empty, idParam, listQuery, requestSchema } from "./adminSchemas.js";

const router = Router();
const view = [adminAuth, requireAccess("payments")];
const change = [...view, requireAccess("payments_write"), requireCsrf];

router.get(
  "/",
  ...view,
  validateRequest(requestSchema({ query: listQuery })),
  asyncHandler(showPayments),
);
router.get("/:paymentId", ...view, validateRequest(requestSchema({ params: idParam("paymentId") })), asyncHandler(showPayment));
router.post(
  "/:paymentId/verify",
  ...change,
  validateRequest(requestSchema({ params: idParam("paymentId"), body: empty })),
  asyncHandler(postVerifyPayment),
);
router.post(
  "/:paymentId/reject",
  ...change,
  validateRequest(
    requestSchema({
      params: idParam("paymentId"),
      body: z.object({ reason: z.string().max(80), detail: z.string().max(180).optional() }).strip(),
    }),
  ),
  asyncHandler(postRejectPayment),
);

export default router;
