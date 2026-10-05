import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/layout/Container";
import { useAuth } from "../context/AuthContext";
import usePageMeta from "../utils/usePageMeta";
import { validateEmail, validateMobile, validateName, validatePassword } from "../utils/validation";

const fieldClass =
  "mt-1 h-14 w-full rounded-[12px] border border-[#292532] bg-card px-4 text-base text-white outline-none focus:border-pink";

export default function Signup() {
  const { user, ready, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = location.state?.from || "/experiences";

  usePageMeta({
    title: "Create Account — MOMNT",
    description: "Create a MOMNT account to reserve your experience.",
    robots: "noindex,nofollow",
  });

  if (ready && user) return <Navigate to={next} replace />;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nameError = validateName(form.name);
    const mobileError = validateMobile(form.mobile);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    if (nameError || mobileError || emailError || passwordError) {
      setError(nameError || mobileError || emailError || passwordError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signup(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-16">
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold tracking-[0.22em] text-white">MOMNT</p>
        <h1 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Create your account</h1>
        <p className="mt-3 text-sm text-text-secondary">Sign up first. Then you can reserve your MOMNT.</p>
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <label className="mt-6 block text-sm text-text-secondary">
          Full name
          <input name="name" autoComplete="name" required value={form.name} onChange={(event) => update("name", event.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-sm text-text-secondary">
          Mobile number
          <input name="mobile" type="tel" inputMode="numeric" autoComplete="tel" required value={form.mobile} onChange={(event) => update("mobile", event.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-sm text-text-secondary">
          Email
          <input name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => update("email", event.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-sm text-text-secondary">
          Password
          <input name="password" type="password" autoComplete="new-password" required value={form.password} onChange={(event) => update("password", event.target.value)} className={fieldClass} />
        </label>
        <p className="mt-2 text-xs text-text-muted">At least 10 characters, with upper and lower case, a number, and a symbol.</p>
        <button type="submit" disabled={busy || !ready} className="mt-6 h-14 w-full rounded-[12px] bg-gradient-to-r from-orange to-pink text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Creating account..." : "Create Account"}
        </button>
        <p className="mt-4 text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" state={{ from: next }} className="font-semibold text-white">
            Sign in
          </Link>
        </p>
      </form>
    </Container>
  );
}
