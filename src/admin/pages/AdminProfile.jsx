import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminPageHeader from "../components/AdminPageHeader";
import { adminRequest } from "../services/adminService";
import { formatWhen } from "../utils/adminHelpers";

export default function AdminProfile() {
  const { admin, refresh, toast, forget } = useAdminAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(admin?.name || "");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState("");

  async function saveName(event) {
    event.preventDefault();
    setBusy("name");
    try {
      await adminRequest("/admin/profile", { method: "PATCH", body: { name } });
      await refresh();
      toast("Admin profile updated");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setBusy("password");
    try {
      await adminRequest("/admin/profile/change-password", { method: "POST", body: passwords });
      forget();
      navigate("/admin/login", { replace: true, state: { message: "Password updated. Sign in again." } });
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminPageHeader title="Profile" subtitle="Your staff account." />
      <dl className="max-w-xl space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-text-muted">Name</dt><dd>{admin?.name}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Email</dt><dd>{admin?.email}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Role</dt><dd>{admin?.role}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Last Login</dt><dd>{formatWhen(admin?.lastLoginAt, true)}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Created At</dt><dd>{formatWhen(admin?.createdAt, true)}</dd></div>
      </dl>
      <form onSubmit={saveName} className="mt-8 max-w-xl">
        <label className="text-sm text-text-secondary">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white" />
        </label>
        <button type="submit" disabled={Boolean(busy)} className="mt-3 rounded-xl border border-border px-4 py-2 text-sm">
          {busy === "name" ? "Saving..." : "Save name"}
        </button>
      </form>
      <form onSubmit={changePassword} className="mt-8 max-w-xl space-y-3">
        <h2 className="text-lg font-semibold">Change Password</h2>
        {[
          ["currentPassword", "Current Password"],
          ["newPassword", "New Password"],
          ["confirmPassword", "Confirm New Password"],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm text-text-secondary">
            {label}
            <input
              type="password"
              autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
              value={passwords[key]}
              onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white"
            />
          </label>
        ))}
        <button type="submit" disabled={Boolean(busy)} className="rounded-xl bg-gradient-to-r from-orange to-pink px-4 py-2 text-sm font-semibold">
          {busy === "password" ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
