import { useEffect, useState } from "react";

export function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatWhen(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function greeting(name) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const first = String(name || "Admin").trim().split(" ")[0] || "Admin";
  return `Good ${part}, ${first}`;
}

export function homeFromAccess(access = []) {
  if (access.includes("dashboard")) return "/admin/dashboard";
  if (access.includes("payments")) return "/admin/payments";
  if (access.includes("events")) return "/admin/events";
  if (access.includes("check_in")) return "/admin/check-in";
  return "/admin/profile";
}

export function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const STATUS = {
  paid: ["Paid", "success"],
  verification_pending: ["Verification Pending", "warning"],
  payment_verification_pending: ["Verification Pending", "warning"],
  pending: ["Pending", "warning"],
  payment_pending: ["Payment Pending", "warning"],
  payment_initiated: ["Pending", "warning"],
  failed: ["Failed", "danger"],
  confirmed: ["Confirmed", "success"],
  cancelled: ["Cancelled", "danger"],
  active: ["Active", "success"],
  checked_in: ["Checked In", "purple"],
  expired: ["Expired", "muted"],
  refunded: ["Refunded", "muted"],
  created: ["Created", "muted"],
  draft: ["Draft", "muted"],
  published: ["Published", "success"],
  sold_out: ["Sold Out", "warning"],
  completed: ["Completed", "purple"],
  archived: ["Archived", "muted"],
};

export function statusMeta(value) {
  return STATUS[value] || [String(value || "Unknown").replaceAll("_", " "), "muted"];
}

export function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function actionLabel(action) {
  return String(action || "")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
}
