import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiBaseUrl, memberCsrf, setMemberCsrf } from "../services/authClient";

const AuthContext = createContext(null);

async function authRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.error?.message || "Unable to connect to MOMNT. Please try again.");
    error.code = payload?.error?.code || "SERVER_ERROR";
    throw error;
  }
  if (payload?.csrfToken) setMemberCsrf(payload.csrfToken);
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    authRequest("/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async signup(details) {
        const data = await authRequest("/auth/signup", { method: "POST", body: details });
        setUser(data.user);
        return data.user;
      },
      async login(email, password) {
        const data = await authRequest("/auth/login", { method: "POST", body: { email, password } });
        setUser(data.user);
        return data.user;
      },
      async logout() {
        await fetch(`${apiBaseUrl()}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json", "X-CSRF-Token": memberCsrf() },
        });
        setMemberCsrf("");
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
