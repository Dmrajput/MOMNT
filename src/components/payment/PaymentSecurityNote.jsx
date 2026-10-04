import { ShieldCheck } from "lucide-react";

export default function PaymentSecurityNote() {
  return (
    <aside className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-pink" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Secure Payment</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        Pay only to the official MOMNT UPI ID shown on this page. Never send money to a personal number or a different UPI ID.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        Your booking is confirmed only after MOMNT verifies the payment.
      </p>
    </aside>
  );
}
