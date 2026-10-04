import { Router } from "express";
import { z } from "zod";
import { postLogin, postLogout, showMe } from "../controllers/adminAuthController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { adminLoginLimiter } from "../middleware/rateLimits.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const empty = z.object({}).optional().default({});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(120),
    password: z.string().min(1).max(128),
  }).strip(),
  params: empty,
  query: empty,
});

router.post("/login", adminLoginLimiter, validateRequest(loginSchema), asyncHandler(postLogin));
router.post("/logout", adminAuth, requireCsrf, asyncHandler(postLogout));
router.get("/me", adminAuth, asyncHandler(showMe));
router.get("/session", adminAuth, asyncHandler(showMe));

export default router;
