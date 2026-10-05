import { logEvent, redact } from "../utils/logger.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isParseError = error?.type === "entity.parse.failed" || error instanceof SyntaxError;
  if (isParseError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please check the details and try again.",
      },
    });
    return;
  }

  if (error?.code === 11000 && error?.keyPattern?.utr) {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_UTR",
        message: "This UTR has already been submitted.",
      },
    });
    return;
  }

  const status = error.status || 500;
  const code = status >= 500 && (!error.code || error.code === "SERVER_ERROR") ? "INTERNAL_SERVER_ERROR" : error.code || "SERVER_ERROR";
  const message =
    status >= 500
      ? "Something went wrong. Please try again."
      : error.message || "Please check the details and try again.";

  if (status >= 500) {
    logEvent("error", {
      requestId: req.id,
      code,
      status,
      message: redact(error.message),
    });
  }

  res.status(status).json({
    success: false,
    error: { code, message },
  });
}
