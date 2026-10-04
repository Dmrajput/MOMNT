import { Router } from "express";
import { z } from "zod";
import { postPayment, postUtr, showPayment } from "../controllers/paymentController.js";
import { createPaymentLimiter, submitUtrLimiter } from "../middleware/rateLimits.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const createSchema = z.object({
  body: z
    .object({
      bookingId: z.string().trim().min(8).max(40),
    })
    .strip(),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

const paymentParams = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    paymentId: z.string().trim().min(8).max(40),
  }),
  query: z.object({}).optional().default({}),
});

const utrSchema = z.object({
  body: z
    .object({
      utr: z.string().max(40),
      payerName: z.string().max(80),
      payerUpiId: z.string().max(320).optional(),
      transactionDate: z.string().max(40).optional(),
    })
    .strip(),
  params: z.object({
    paymentId: z.string().trim().min(8).max(40),
  }),
  query: z.object({}).optional().default({}),
});

router.post("/create", createPaymentLimiter, validateRequest(createSchema), asyncHandler(postPayment));
router.post("/:paymentId/submit-utr", submitUtrLimiter, validateRequest(utrSchema), asyncHandler(postUtr));
router.get("/:paymentId", validateRequest(paymentParams), asyncHandler(showPayment));

export default router;
