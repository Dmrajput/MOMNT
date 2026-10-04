import { AppError } from "../utils/errors.js";

function rejectUnsafeKeys(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes("[") || key.includes(".")) {
      throw new AppError("VALIDATION_ERROR", "Please check the details and try again.", 400);
    }
    if (child && typeof child === "object") rejectUnsafeKeys(child, label);
  }
}

export function validateRequest(schema) {
  return function validator(req, res, next) {
    try {
      rejectUnsafeKeys(req.query, "query");
      rejectUnsafeKeys(req.body, "body");
    } catch (error) {
      next(error);
      return;
    }
    const parsed = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });
    if (!parsed.success) {
      next(new AppError("VALIDATION_ERROR", "Please check the details and try again.", 400));
      return;
    }
    req.validated = parsed.data;
    next();
  };
}
