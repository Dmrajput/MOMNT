import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import usePageMeta from "../../utils/usePageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";
import ConfirmDialog from "./ConfirmDialog";
import AdminHeader from "./AdminHeader";
import AdminMobileNav from "./AdminMobileNav";
import AdminSidebar from "./AdminSidebar";
import { adminRequest } from "../services/adminService";

export function useAdminChrome() {
  return useOutletContext();
}

export default function AdminLayout() {
  const { logout, toasts, dismissToast } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [eventMode, setEventMode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [environment, setEnvironment] = useState("");

  usePageMeta({
    title: "MOMNT Admin",
    description: "Internal MOMNT operations console.",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    adminRequest("/health", { session: false })
      .then((data) => setEnvironment(data.environment || ""))
      .catch(() => setEnvironment(""));
  }, []);

  async function signOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content
      </a>
      {!eventMode ? (
        <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border md:block">
          <AdminSidebar onLogout={() => setConfirmLogout(true)} />
        </aside>
      ) : null}
      <AdminMobileNav open={menuOpen} onClose={() => setMenuOpen(false)}>
        <AdminSidebar onNavigate={() => setMenuOpen(false)} onLogout={() => setConfirmLogout(true)} />
      </AdminMobileNav>
      <div className={eventMode ? "" : "md:pl-60"}>
        {!eventMode ? <AdminHeader onMenu={() => setMenuOpen(true)} environment={environment} /> : null}
        <main id="admin-main" className="px-4 py-6 md:px-8">
          <Outlet context={{ eventMode, setEventMode }} />
        </main>
      </div>
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(320px,calc(100%-2rem))] flex-col gap-2">
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismissToast(item.id)}
            className="pointer-events-auto rounded-xl border border-border bg-card-elevated px-4 py-3 text-left text-sm text-white shadow-lg"
          >
            {item.message}
          </button>
        ))}
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out of MOMNT Admin?"
        confirmLabel="Sign Out"
        busy={signingOut}
        busyLabel="Signing out..."
        onClose={() => setConfirmLogout(false)}
        onConfirm={signOut}
      />
    </div>
  );
}
