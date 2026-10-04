import crypto from "node:crypto";
import AdminAuditLog from "../models/AdminAuditLog.js";

const BLOCKED = new Set([
  "password",
  "passwordHash",
  "token",
  "qrToken",
  "csrfToken",
  "authorization",
  "cookie",
]);

function sanitize(value, depth = 0) {
  if (value == null || depth > 4) return value ?? null;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (BLOCKED.has(key)) continue;
    output[key] = sanitize(item, depth + 1);
  }
  return output;
}

export async function recordAdminAudit({
  adminId = null,
  action,
  resourceType = "",
  resourceId = "",
  previousValue = null,
  newValue = null,
  req = null,
}) {
  await AdminAuditLog.create({
    adminId,
    action,
    resourceType,
    resourceId: String(resourceId || ""),
    previousValue: sanitize(previousValue),
    newValue: sanitize(newValue),
    ipAddress: String(req?.ip || "").slice(0, 80),
    userAgent: String(req?.get?.("user-agent") || "").slice(0, 180),
  });
}

export function customerKey(email) {
  return crypto.createHash("sha256").update(String(email || "").trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function pageParams(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const requested = Number(query.limit) || 20;
  const limit = [20, 50, 100].includes(requested) ? requested : 20;
  return { page, limit, skip: (page - 1) * limit };
}

export function pageResult(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function cleanSearch(value) {
  return String(value || "")
    .replace(/[${}]/g, "")
    .trim()
    .slice(0, 80);
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
