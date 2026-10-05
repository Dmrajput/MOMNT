import { Router } from "express";
import { z } from "zod";
import { postLogin, postLogout, postSignup, showMe } from "../controllers/userAuthController.js";
import { userAuth } from "../middleware/userAuth.js";
import { requireUserCsrf } from "../middleware/userCsrf.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const empty = z.object({}).optional().default({});

const signupSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(120),
      mobile: z.string().trim().min(10).max(20),
      password: z.string().min(10).max(128),
    })
    .strip(),
  params: empty,
  query: empty,
});

const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().max(120),
      password: z.string().min(1).max(128),
    })
    .strip(),
  params: empty,
  query: empty,
});

router.post("/signup", authLimiter, validateRequest(signupSchema), asyncHandler(postSignup));
router.post("/login", authLimiter, validateRequest(loginSchema), asyncHandler(postLogin));
router.post("/logout", userAuth, requireUserCsrf, asyncHandler(postLogout));
router.get("/me", userAuth, asyncHandler(showMe));

export default router;
