import { AppError } from "../utils/errors.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireUserCsrf(req, res, next) {
  if (SAFE.has(req.method)) {
    next();
    return;
  }
  const header = String(req.get("x-csrf-token") || "");
  const cookie = String(req.cookies?.momnt_user_csrf || "");
  if (!header || !cookie || header !== cookie) {
    next(new AppError("CSRF_INVALID", "Your session could not be verified. Please sign in again.", 403));
    return;
  }
  next();
}
