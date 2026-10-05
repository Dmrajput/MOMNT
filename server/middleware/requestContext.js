import crypto from "node:crypto";
import { logEvent } from "../utils/logger.js";

export function requestContext(req, res, next) {
  const incoming = String(req.get("x-request-id") || "");
  const requestId = /^[A-Za-z0-9._-]{8,80}$/.test(incoming) ? incoming : crypto.randomUUID();
  req.id = requestId;
  res.set("X-Request-ID", requestId);
  if (process.env.NODE_ENV !== "test") {
    const started = Date.now();
    res.on("finish", () => {
      logEvent(res.statusCode >= 500 ? "error" : "info", {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - started,
      });
    });
  }
  next();
}
