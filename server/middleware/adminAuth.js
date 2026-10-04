import Admin from "../models/Admin.js";
import { AppError } from "../utils/errors.js";
import { readAdminToken } from "../utils/adminToken.js";

export async function adminAuth(req, res, next) {
  try {
    const token = req.cookies?.momnt_admin;
    const payload = token ? readAdminToken(token) : null;
    if (!payload?.sub) {
      throw new AppError("UNAUTHORIZED", "Your admin session has expired. Please sign in again.", 401);
    }
    const admin = await Admin.findById(payload.sub);
    if (!admin || admin.status !== "active" || (admin.tokenVersion || 0) !== (payload.tv || 0)) {
      throw new AppError("UNAUTHORIZED", "Your admin session has expired. Please sign in again.", 401);
    }
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}
