import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

export function usePaymentTimer(expiresAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return {
    expired: Boolean(expiresAt) && remaining <= 0,
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}

export default function PaymentTimer({ label, expired }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <Clock3 className="size-5 text-pink" aria-hidden="true" />
        <p className="text-sm text-text-secondary">{expired ? "Payment session" : "Payment reserved for"}</p>
      </div>
      <p className="text-lg font-semibold tracking-[0.04em] text-white" aria-live="polite">
        {expired ? "Expired" : label}
      </p>
    </div>
  );
}
