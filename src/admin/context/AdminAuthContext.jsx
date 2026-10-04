import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminRequest, setAdminCsrf } from "../services/adminService";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message) => {
    setToasts((current) => {
      if (current.some((item) => item.message === message)) return current;
      return [...current, { id: crypto.randomUUID(), message }];
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const clearSession = useCallback(
    (expired) => {
      setAdmin(null);
      setAdminCsrf("");
      if (!expired || window.location.pathname.startsWith("/admin/login")) return;
      setNotice("Your admin session has expired. Please sign in again.");
      navigate("/admin/login", { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    const onExpired = () => clearSession(true);
    window.addEventListener("momnt-admin-unauthorized", onExpired);
    return () => window.removeEventListener("momnt-admin-unauthorized", onExpired);
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    adminRequest("/admin/auth/me", { session: false })
      .then((data) => {
        if (!active) return;
        setAdminCsrf(data.csrfToken);
        setAdmin(data.admin);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await adminRequest("/admin/auth/login", {
      method: "POST",
      body: { email, password },
      session: false,
    });
    setAdminCsrf(data.csrfToken);
    setAdmin(data.admin);
    setNotice("");
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminRequest("/admin/auth/logout", { method: "POST", session: false });
    } catch {
      /* The cookie is cleared locally even if the session already ended. */
    }
    setAdmin(null);
    setAdminCsrf("");
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  const refresh = useCallback(async () => {
    const data = await adminRequest("/admin/auth/me");
    setAdminCsrf(data.csrfToken);
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const forget = useCallback(() => {
    setAdmin(null);
    setAdminCsrf("");
  }, []);

  const value = useMemo(
    () => ({
      admin,
      ready,
      notice,
      toasts,
      toast,
      dismissToast,
      login,
      logout,
      refresh,
      forget,
      can: (key) => Boolean(admin?.access?.includes(key)),
    }),
    [admin, ready, notice, toasts, toast, dismissToast, login, logout, refresh, forget],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("Admin auth is unavailable.");
  return value;
}
