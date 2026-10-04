import { AppError } from "../utils/errors.js";
import { accessFor } from "../utils/permissions.js";

export function requireAccess(...keys) {
  return function checkAccess(req, res, next) {
    const access = accessFor(req.admin?.role);
    const allowed = keys.some((key) => access.includes(key));
    if (!allowed) {
      next(new AppError("FORBIDDEN", "You do not have permission to perform this action.", 403));
      return;
    }
    next();
  };
}

export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!roles.includes(req.admin?.role)) {
      next(new AppError("FORBIDDEN", "You do not have permission to perform this action.", 403));
      return;
    }
    next();
  };
}
