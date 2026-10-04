import { AppError } from "../utils/errors.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireCsrf(req, res, next) {
  if (SAFE.has(req.method)) {
    next();
    return;
  }
  const header = String(req.get("x-csrf-token") || "");
  const cookie = String(req.cookies?.momnt_admin_csrf || "");
  if (!header || !cookie || header !== cookie) {
    next(new AppError("CSRF_INVALID", "The admin session could not be verified. Please sign in again.", 403));
    return;
  }
  next();
}
