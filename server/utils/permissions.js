const ACCESS = {
  SUPER_ADMIN: [
    "dashboard",
    "events",
    "events_write",
    "events_cancel",
    "bookings",
    "bookings_cancel",
    "payments",
    "payments_write",
    "tickets",
    "tickets_cancel",
    "customers",
    "check_in",
    "reports",
    "payment_reports",
    "settings",
    "profile",
  ],
  ADMIN: [
    "dashboard",
    "events",
    "events_write",
    "events_cancel",
    "bookings",
    "bookings_cancel",
    "payments",
    "payments_write",
    "tickets",
    "tickets_cancel",
    "customers",
    "check_in",
    "reports",
    "payment_reports",
    "settings",
    "profile",
  ],
  EVENT_MANAGER: ["events", "events_write", "bookings", "tickets", "customers", "check_in", "profile"],
  PAYMENT_MANAGER: ["bookings", "payments", "payments_write", "customers", "payment_reports", "profile"],
  CHECK_IN_MANAGER: ["tickets", "check_in", "profile"],
};

export function accessFor(role) {
  return ACCESS[role] || ["profile"];
}

export function homePathFor(role) {
  if (role === "CHECK_IN_MANAGER") return "/admin/check-in";
  if (role === "PAYMENT_MANAGER") return "/admin/payments";
  if (role === "EVENT_MANAGER") return "/admin/events";
  return "/admin/dashboard";
}
