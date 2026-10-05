export function maintenanceMode(req, res, next) {
  if (process.env.MAINTENANCE_MODE !== "1") {
    next();
    return;
  }
  if (req.path.startsWith("/api/health") || req.path.startsWith("/api/admin")) {
    next();
    return;
  }
  if (req.method !== "GET" && (req.path.startsWith("/api/bookings") || req.path.startsWith("/api/payments"))) {
    res.status(503).json({
      success: false,
      error: {
        code: "MAINTENANCE",
        message: "MOMNT is temporarily unavailable.",
      },
    });
    return;
  }
  next();
}
