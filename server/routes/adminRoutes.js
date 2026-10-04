import { Router } from "express";
import authRoutes from "./adminAuthRoutes.js";
import bookingRoutes from "./adminBookingRoutes.js";
import checkInRoutes from "./adminCheckInRoutes.js";
import customerRoutes from "./adminCustomerRoutes.js";
import dashboardRoutes from "./adminDashboardRoutes.js";
import eventRoutes from "./adminEventRoutes.js";
import paymentRoutes from "./adminPaymentRoutes.js";
import { profileRouter, reportRouter, settingsRouter } from "./adminReportRoutes.js";
import ticketRoutes from "./adminTicketRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/events", eventRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/customers", customerRoutes);
router.use("/check-in", checkInRoutes);
router.use("/reports", reportRouter);
router.use("/profile", profileRouter);
router.use("/settings", settingsRouter);

export default router;
