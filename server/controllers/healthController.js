import { APP_VERSION, readinessChecks, runtimeEnvironment } from "../config/runtime.js";

export function showHealth(req, res) {
  res.json({
    success: true,
    status: "ok",
    environment: runtimeEnvironment(),
    version: APP_VERSION,
  });
}

export function showLive(req, res) {
  res.json({ success: true, status: "ok" });
}

export function showReady(req, res) {
  const checks = readinessChecks();
  const ready = checks.database === "connected" && checks.configuration === "ok";
  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ok" : "unavailable",
    checks,
  });
}
