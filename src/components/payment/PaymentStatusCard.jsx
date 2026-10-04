import { CircleAlert, CircleCheck, Clock3, TimerReset } from "lucide-react";
import { formatPrice } from "../../utils/helpers";

const views = {
  payment_initiated: {
    icon: Clock3,
    eyebrow: "Payment Pending",
    title: "Complete Your Payment",
    message: "Your MOMNT is reserved until this payment session ends.",
  },
  pending: {
    icon: Clock3,
    eyebrow: "Payment Pending",
    title: "Complete Your Payment",
    message: "Your MOMNT is reserved until this payment session ends.",
  },
  verification_pending: {
    icon: Clock3,
    eyebrow: "Verification Pending",
    title: "Payment Submitted",
    message:
      "Your UTR has been submitted successfully. Once the payment is verified, your MOMNT booking will be confirmed.",
  },
  paid: {
    icon: CircleCheck,
    eyebrow: "Paid",
    title: "Payment Confirmed",
    message: "Your MOMNT access is ready.",
  },
  failed: {
    icon: CircleAlert,
    eyebrow: "Verification Failed",
    title: "Payment Verification Failed",
    message: "We couldn't verify this payment.",
  },
  expired: {
    icon: TimerReset,
    eyebrow: "Expired",
    title: "Payment Session Expired",
    message: "This payment session has expired. Please create a new payment session.",
  },
  cancelled: {
    icon: CircleAlert,
    eyebrow: "Cancelled",
    title: "Payment Cancelled",
    message: "This payment session is no longer active.",
  },
};

function Line({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export default function PaymentStatusCard({ status }) {
  const view = views[status.paymentStatus] || views.pending;
  const Icon = view.icon;
  const bookingLabel =
    status.bookingStatus === "confirmed"
      ? "Confirmed"
      : status.bookingStatus === "payment_verification_pending"
        ? "Verification Pending"
        : status.bookingStatus === "expired"
          ? "Expired"
          : status.bookingStatus === "payment_pending"
            ? "Payment Pending"
            : status.bookingStatus;

  return (
    <article className="mx-auto w-full max-w-xl rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-[20px] sm:p-8">
      <div className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <Icon className="size-7 text-pink" aria-hidden="true" />
      </div>
      <p className="mt-6 text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">{view.eyebrow}</p>
      <h1 className="mt-3 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        {view.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-text-secondary">{view.message}</p>
      {status.paymentStatus === "failed" && status.rejectionReason ? (
        <p className="mt-3 text-sm text-text-secondary">{status.rejectionReason}</p>
      ) : null}
      <dl className="mt-8">
        <Line label="Booking" value={status.bookingId} />
        {status.amount !== undefined ? <Line label="Amount" value={formatPrice(status.amount)} /> : null}
        <Line label="Status" value={view.eyebrow} />
        <Line label="Booking Status" value={bookingLabel} />
      </dl>
    </article>
  );
}
