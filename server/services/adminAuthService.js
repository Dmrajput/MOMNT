import Admin from "../models/Admin.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, passwordIsStrong, verifyPassword } from "../utils/password.js";
import { accessFor } from "../utils/permissions.js";
import { recordAdminAudit } from "../utils/adminQuery.js";

const INVALID = "Invalid email or password.";

export function presentAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    access: accessFor(admin.role),
  };
}

export async function loginAdmin({ email, password, req }) {
  const normalized = String(email || "").trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalized });
  const passwordHash = admin?.passwordHash || "$2b$04$oDGxvRjgT22QdjztKmO79.lV91xKbFiekxQHnWx5oIUmHg56cccQ2";
  const matches = await verifyPassword(String(password || ""), admin ? admin.passwordHash : passwordHash);
  if (!admin || admin.status !== "active" || !matches) {
    throw new AppError("UNAUTHORIZED", INVALID, 401);
  }
  admin.lastLoginAt = new Date();
  admin.lastLoginIp = String(req?.ip || "").slice(0, 80);
  await admin.save();
  await recordAdminAudit({
    adminId: admin._id,
    action: "ADMIN_LOGIN",
    resourceType: "admin",
    resourceId: String(admin._id),
    req,
  });
  return admin;
}

export async function changeAdminPassword(admin, { currentPassword, newPassword }) {
  if (!passwordIsStrong(newPassword)) {
    throw new AppError("VALIDATION_ERROR", "Choose a stronger password.", 400);
  }
  const matches = await verifyPassword(String(currentPassword || ""), admin.passwordHash);
  if (!matches) {
    throw new AppError("UNAUTHORIZED", "Unable to change the password. Please check the details and try again.", 401);
  }
  admin.passwordHash = await hashPassword(newPassword);
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();
  return admin;
}

export async function updateAdminProfile(admin, { name }) {
  const nextName = String(name || "").trim();
  if (nextName.length < 2 || nextName.length > 80) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid name.", 400);
  }
  admin.name = nextName;
  await admin.save();
  return admin;
}
