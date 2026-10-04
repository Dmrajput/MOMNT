import { Router } from "express";
import { z } from "zod";
import { getPaymentStatus, postBooking } from "../controllers/bookingController.js";
import { showBookingTicket } from "../controllers/ticketController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

const createBookingSchema = z.object({
  body: z
    .object({
      eventId: z.string().trim().min(1).max(80),
      quantity: z.coerce.number().int(),
      customer: z.object({
        name: z.string().max(80),
        mobile: z.string().max(20),
        email: z.string().max(120),
      }),
      guestNames: z.string().max(240).optional(),
    })
    .strip(),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

const statusSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    bookingId: z.string().trim().min(8).max(40),
  }),
  query: z.object({}).optional().default({}),
});

router.post("/", validateRequest(createBookingSchema), asyncHandler(postBooking));
router.get("/:bookingId/payment-status", validateRequest(statusSchema), asyncHandler(getPaymentStatus));
router.get("/:bookingId/ticket", validateRequest(statusSchema), asyncHandler(showBookingTicket));

export default router;
