import { formatPrice } from "../../utils/helpers";

export default function PaymentAmountCard({ amount, quantity }) {
  return (
    <section className="rounded-[16px] border border-border bg-card p-5">
      <p className="text-sm text-text-secondary">Amount to Pay</p>
      <p className="mt-2 text-4xl font-bold tracking-[-0.04em] text-white">{formatPrice(amount)}</p>
      {quantity ? (
        <p className="mt-2 text-sm text-text-muted">
          {quantity} {quantity === 1 ? "pass" : "passes"}
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Pay the exact amount shown above to the official MOMNT UPI ID.
      </p>
    </section>
  );
}
