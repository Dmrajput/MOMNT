import { AppError } from "../utils/errors.js";

const FIELD_MESSAGES = {
  name: "Please enter your full name.",
  email: "Please enter a valid email address.",
  mobile: "Please enter a valid 10-digit mobile number.",
  password: "Password must be at least 10 characters and include upper and lower case, a number, and a symbol.",
};

function validationMessage(error) {
  const field = error.issues?.[0]?.path?.find((part) => FIELD_MESSAGES[part]);
  return FIELD_MESSAGES[field] || "Please check the details and try again.";
}

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
      next(new AppError("VALIDATION_ERROR", validationMessage(parsed.error), 400));
      return;
    }
    req.validated = parsed.data;
    next();
  };
}
