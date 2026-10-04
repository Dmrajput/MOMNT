import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";

const TOKEN_TTL = "8h";

export function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "");
  const placeholder = secret === "replace-this-later";
  if (secret.length < 16 || (process.env.NODE_ENV === "production" && placeholder)) {
    throw new AppError("SERVER_ERROR", "Admin authentication is not configured.", 500);
  }
  return secret;
}

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: String(admin._id), role: admin.role, tv: admin.tokenVersion || 0 },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL, issuer: "momnt-admin" },
  );
}

export function readAdminToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { issuer: "momnt-admin" });
  } catch {
    return null;
  }
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function authCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (production ? "strict" : "lax");
  return {
    httpOnly: true,
    secure: production,
    sameSite,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function csrfCookieOptions() {
  return { ...authCookieOptions(), httpOnly: false };
}
