import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/layout/Container";
import { useAuth } from "../context/AuthContext";
import usePageMeta from "../utils/usePageMeta";

const fieldClass =
  "mt-1 h-14 w-full rounded-[12px] border border-[#292532] bg-card px-4 text-base text-white outline-none focus:border-pink";

export default function Login() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = location.state?.from || "/experiences";

  usePageMeta({
    title: "Sign In — MOMNT",
    description: "Sign in to reserve your MOMNT.",
    robots: "noindex,nofollow",
  });

  if (ready && user) return <Navigate to={next} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-16">
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold tracking-[0.22em] text-white">MOMNT</p>
        <h1 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Sign in</h1>
        <p className="mt-3 text-sm text-text-secondary">Sign in before you reserve your MOMNT.</p>
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <label className="mt-6 block text-sm text-text-secondary">
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-sm text-text-secondary">
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} />
        </label>
        <button type="submit" disabled={busy || !ready} className="mt-6 h-14 w-full rounded-[12px] bg-gradient-to-r from-orange to-pink text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Signing in..." : "Sign In"}
        </button>
        <p className="mt-4 text-sm text-text-secondary">
          New to MOMNT?{" "}
          <Link to="/signup" state={{ from: next }} className="font-semibold text-white">
            Create an account
          </Link>
        </p>
      </form>
    </Container>
  );
}
