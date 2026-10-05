import mongoose from "mongoose";

export const APP_VERSION = "1.0.0";

export function runtimeEnvironment() {
  const value = String(process.env.NODE_ENV || "development");
  if (value === "production" || value === "staging" || value === "test" || value === "development") return value;
  return "development";
}

export function readinessChecks() {
  const environment = runtimeEnvironment();
  const secret = String(process.env.JWT_SECRET || "");
  const placeholder = secret === "replace-this-later" || secret === "replace-with-long-random-secret";
  const configurationOk =
    secret.length >= 16 &&
    !(environment === "production" && placeholder) &&
    (environment !== "production" || Boolean(process.env.CLIENT_URL && process.env.UPI_ID && process.env.MONGODB_URI));

  return {
    database: mongoose.connection.readyState === 1 ? "connected" : "unavailable",
    configuration: configurationOk ? "ok" : "unavailable",
  };
}
