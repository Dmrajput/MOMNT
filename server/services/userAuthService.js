import User from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, passwordIsStrong, verifyPassword } from "../utils/password.js";
import { validateCustomer } from "../utils/validators.js";

const INVALID = "Invalid email or password.";

export function presentUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    mobile: user.mobile,
  };
}

export async function registerUser({ name, email, mobile, password }) {
  const person = validateCustomer({ name, email, mobile });
  if (!person) {
    throw new AppError("VALIDATION_ERROR", "Please check your name, mobile number, and email.", 400);
  }
  if (!passwordIsStrong(password)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Password must be at least 10 characters and include upper and lower case, a number, and a symbol.",
      400,
    );
  }
  const existing = await User.findOne({ email: person.email });
  if (existing) {
    throw new AppError("EMAIL_IN_USE", "An account with this email already exists.", 409);
  }
  return User.create({
    name: person.name,
    email: person.email,
    mobile: person.mobile,
    passwordHash: await hashPassword(password),
  });
}

export async function loginUser({ email, password }) {
  const normalized = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  const passwordHash = user?.passwordHash || "$2b$04$oDGxvRjgT22QdjztKmO79.lV91xKbFiekxQHnWx5oIUmHg56cccQ2";
  const matches = await verifyPassword(String(password || ""), user ? user.passwordHash : passwordHash);
  if (!user || user.status !== "active" || !matches) {
    throw new AppError("UNAUTHORIZED", INVALID, 401);
  }
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}
