import { Router } from "express";
import { z } from "zod";
import { listEvents, showEvent } from "../controllers/publicEventController.js";
import { noStore } from "../middleware/noStore.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const empty = {
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
};

const listSchema = z.object({
  ...empty,
  params: z.object({}).optional().default({}),
});

const slugSchema = z.object({
  ...empty,
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});

router.use(noStore);
router.get("/", validateRequest(listSchema), asyncHandler(listEvents));
router.get("/:slug", validateRequest(slugSchema), asyncHandler(showEvent));

export default router;
