import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import Admin from "./models/Admin.js";
import { hashPassword, passwordIsStrong } from "./utils/password.js";

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
const name = String(process.env.ADMIN_NAME || "MOMNT Admin").trim();

if (!email || !password) {
  console.error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before seeding an admin.");
  process.exit(1);
}

if (!passwordIsStrong(password)) {
  console.error("ADMIN_PASSWORD must be at least 10 characters and include upper and lower case, a number, and a symbol.");
  process.exit(1);
}

await connectDb();
const existing = await Admin.findOne({ email });
if (existing) {
  console.log("An admin with that email already exists. No duplicate was created.");
} else {
  await Admin.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "SUPER_ADMIN",
    status: "active",
  });
  console.log("Super admin created.");
}
await mongoose.disconnect();
