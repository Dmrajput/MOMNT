import { useEffect, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { adminRequest } from "../services/adminService";

const LABELS = [
  ["businessName", "Business Name"],
  ["businessEmail", "Business Email"],
  ["supportPhone", "Support Phone"],
  ["currency", "Default Currency"],
  ["upiDisplayName", "UPI Display Name"],
  ["paymentExpiryMinutes", "Payment Expiry"],
  ["environment", "Environment"],
  ["version", "Version"],
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRequest("/admin/settings")
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err.message));
  }, []);

  if (!settings && !error) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <AdminPageHeader title="Settings" subtitle="Read-only configuration. Secrets are not shown here." />
      <dl className="max-w-xl rounded-2xl border border-border bg-card">
        {LABELS.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0">
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-white">{key === "paymentExpiryMinutes" ? `${settings[key]} minutes` : settings[key] || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
