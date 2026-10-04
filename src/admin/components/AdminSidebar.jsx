import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Ticket,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", access: "dashboard", icon: LayoutDashboard },
  { to: "/admin/events", label: "Events", access: "events", icon: CalendarCheck },
  { to: "/admin/bookings", label: "Bookings", access: "bookings", icon: ClipboardList },
  { to: "/admin/payments", label: "Payments", access: "payments", icon: Wallet },
  { to: "/admin/tickets", label: "Tickets", access: "tickets", icon: Ticket },
  { to: "/admin/customers", label: "Customers", access: "customers", icon: Users },
  { to: "/admin/check-in", label: "Check-In", access: "check_in", icon: QrCode },
  { to: "/admin/reports", label: "Reports", access: "reports", also: "payment_reports", icon: ClipboardList },
  { to: "/admin/settings", label: "Settings", access: "settings", icon: Settings },
  { to: "/admin/profile", label: "Profile", access: "profile", icon: UserRound },
];

export default function AdminSidebar({ onNavigate, onLogout }) {
  const { can } = useAdminAuth();
  const items = ITEMS.filter((item) => can(item.access) || (item.also && can(item.also)) || item.access === "profile");

  return (
    <div className="flex h-full flex-col bg-bg-secondary">
      <div className="px-5 py-6">
        <p className="text-lg font-semibold tracking-[0.18em] text-white">MOMNT</p>
        <p className="text-xs text-text-muted">Admin</p>
      </div>
      <nav aria-label="Admin" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  isActive ? "bg-white/8 text-white" : "text-text-secondary hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}
