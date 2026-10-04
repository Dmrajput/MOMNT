import { Router } from "express";
import { z } from "zod";
import { showTicket, showTicketQr, showValidation } from "../controllers/ticketController.js";
import { noStore } from "../middleware/noStore.js";
import { readTicketLimiter, validateTicketLimiter } from "../middleware/rateLimits.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const empty = {
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
};

const ticketIdSchema = z.object({
  ...empty,
  params: z.object({
    ticketId: z.string().trim().min(1).max(40),
  }),
});

const validateSchema = z.object({
  ...empty,
  params: z.object({
    qrToken: z.string().trim().min(1).max(200),
  }),
});

router.use(noStore);
router.get("/validate/:qrToken", validateTicketLimiter, validateRequest(validateSchema), asyncHandler(showValidation));
router.get("/:ticketId/qr", readTicketLimiter, validateRequest(ticketIdSchema), asyncHandler(showTicketQr));
router.get("/:ticketId", readTicketLimiter, validateRequest(ticketIdSchema), asyncHandler(showTicket));

export default router;
