import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import usePageMeta from "../../utils/usePageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";
import { homeFromAccess } from "../utils/adminHelpers";

export default function AdminLogin() {
  const { admin, ready, login, notice } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  usePageMeta({
    title: "MOMNT Admin Sign In",
    description: "Staff sign in for the MOMNT admin console.",
    robots: "noindex,nofollow",
  });

  if (ready && admin) {
    return <Navigate to={location.state?.from || homeFromAccess(admin.access)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedIn = await login(email, password);
      navigate(homeFromAccess(signedIn.access), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-white">MOMNT</p>
        <h1 className="mt-3 text-2xl font-semibold">Admin Console</h1>
        <p className="mt-2 text-sm text-text-secondary">Sign in with your staff account.</p>
        {notice || location.state?.message ? (
          <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning" role="status">
            {notice || location.state?.message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-white" role="alert">
            {error}
          </p>
        ) : null}
        <label className="mt-6 block text-sm text-text-secondary">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-white outline-none focus:border-pink"
          />
        </label>
        <label className="mt-4 block text-sm text-text-secondary">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-white outline-none focus:border-pink"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange to-pink py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
