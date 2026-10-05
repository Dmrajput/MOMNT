import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { showHealth, showLive, showReady } from "./controllers/healthController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { maintenanceMode } from "./middleware/maintenanceMode.js";
import { notFound } from "./middleware/notFound.js";
import { requestContext } from "./middleware/requestContext.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

function allowedOrigins() {
  const configured = [process.env.CLIENT_URL, process.env.ADMIN_CLIENT_URL].filter(Boolean);
  if (process.env.NODE_ENV === "production") return new Set(configured);
  return new Set([
    ...configured,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ]);
}

export function createApp() {
  const app = express();
  const production = process.env.NODE_ENV === "production";
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: production ? { maxAge: 15552000, includeSubDomains: true } : false,
      contentSecurityPolicy: production ? undefined : false,
    }),
  );
  const origins = allowedOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        callback(null, origins.has(origin) ? origin : false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept", "X-CSRF-Token", "Idempotency-Key"],
    }),
  );
  app.use(requestContext);
  app.use(cookieParser());
  app.use(express.json({ limit: "16kb" }));
  app.use(maintenanceMode);

  app.get("/api/health/live", showLive);
  app.get("/api/health/ready", showReady);
  app.get("/api/health", showHealth);
  app.use("/api/auth", authRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
