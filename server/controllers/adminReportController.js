import {
  eventPerformance,
  getAdminPayment,
  listPayments,
  reportOverview,
  settingsView,
  toCsv,
} from "../services/adminReportService.js";
import { searchBookings } from "../services/adminBookingService.js";
import { listTickets } from "../services/adminReportService.js";
import { changeAdminPassword, presentAdmin, updateAdminProfile } from "../services/adminAuthService.js";
import { clearAdminCookies } from "./adminAuthController.js";
import { recordAdminAudit } from "../utils/adminQuery.js";
import { AppError } from "../utils/errors.js";
import { accessFor } from "../utils/permissions.js";

export async function showOverview(req, res) {
  res.json({ success: true, report: await reportOverview(req.validated?.query || req.query) });
}

export async function showEventReports(req, res) {
  res.json({ success: true, data: await eventPerformance() });
}

export async function showRevenue(req, res) {
  const report = await reportOverview(req.validated?.query || req.query);
  res.json({
    success: true,
    report: {
      grossRevenue: report.grossRevenue,
      refundedRevenue: report.refundedRevenue,
      netRevenue: report.netRevenue,
      rangeRevenue: report.rangeRevenue || 0,
    },
  });
}

export async function showCheckInReport(req, res) {
  const report = await reportOverview(req.validated?.query || req.query);
  res.json({
    success: true,
    report: {
      checkedIn: report.checkedIn,
      checkedInPasses: report.checkedInPasses,
      ticketsIssued: report.ticketsIssued,
      checkInRate: report.checkInRate,
    },
  });
}

async function sendCsv(req, res, filename, rows, resource) {
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "REPORT_EXPORTED",
    resourceType: "report",
    resourceId: resource,
    req,
  });
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="${filename}"`);
  res.set("Cache-Control", "no-store");
  res.send(toCsv(rows));
}

export async function exportReport(req, res) {
  const query = req.validated?.query || req.query;
  const type = String(query.type || "bookings");
  const access = accessFor(req.admin.role);
  if (!access.includes("reports") && type !== "payments") {
    throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
  if (type === "bookings") {
    const result = await searchBookings({ ...query, page: 1, limit: 100 });
    await sendCsv(req, res, "momnt-bookings.csv", result.data, "bookings");
    return;
  }
  if (type === "payments") {
    const result = await listPayments({ ...query, page: 1, limit: 100 });
    await sendCsv(req, res, "momnt-payments.csv", result.data, "payments");
    return;
  }
  if (type === "check-ins") {
    const result = await listTickets({ ...query, status: "checked_in", page: 1, limit: 100 });
    await sendCsv(req, res, "momnt-check-ins.csv", result.data, "check-ins");
    return;
  }
  if (type === "events") {
    await sendCsv(req, res, "momnt-events.csv", await eventPerformance(), "events");
    return;
  }
  throw new AppError("VALIDATION_ERROR", "Choose a valid export.", 400);
}

export function showSettings(req, res) {
  res.json({ success: true, settings: settingsView() });
}

export function showProfile(req, res) {
  res.json({ success: true, admin: presentAdmin(req.admin) });
}

export async function patchProfile(req, res) {
  const admin = await updateAdminProfile(req.admin, req.validated.body);
  res.json({ success: true, admin: presentAdmin(admin) });
}

export async function postPassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.validated.body;
  if (newPassword !== confirmPassword) {
    throw new AppError("VALIDATION_ERROR", "The new passwords do not match.", 400);
  }
  await changeAdminPassword(req.admin, { currentPassword, newPassword });
  clearAdminCookies(res);
  res.json({ success: true });
}

export { getAdminPayment };
