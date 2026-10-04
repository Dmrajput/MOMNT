import { CircleCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getEventById } from "../../data/events";
import { formatPrice } from "../../utils/helpers";

function Line({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

const STATUS_LABEL = {
  pending: "Payment Pending",
  verification_pending: "Verification Pending",
  confirmed: "Confirmed",
};

export default function BookingSuccessCard({ booking, accessState = "pending" }) {
  const reduce = useReducedMotion();
  const event = getEventById(booking.eventId);
  const confirmed = accessState === "confirmed";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-xl rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[20px] sm:p-8"
    >
      <div className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
        <CircleCheck className="size-7 text-success" aria-hidden="true" />
      </div>
      <p className="mt-6 text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
        {confirmed ? "Confirmed" : "Booking Created"}
      </p>
      <h1 className="mt-3 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        {confirmed ? "Your MOMNT is Confirmed" : "Your MOMNT is Reserved"}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-text-secondary">
        {confirmed
          ? "Your MOMNT access is ready."
          : "Your booking is created. Payment will be completed in the next step."}
      </p>
      <dl className="mt-8">
        <Line label="Booking ID" value={booking.bookingId} />
        <Line label="Experience" value={event?.number || booking.eventNumber} />
        <Line label="Title" value={event?.title || booking.eventName} />
        <Line label="Date" value={event?.date || "25 Oct 2026"} />
        <Line label="Time" value={event?.time || ""} />
        <Line label="Location" value={event?.location || "Ahmedabad"} />
        <Line label="Passes" value={String(booking.quantity)} />
        <Line label="Total" value={formatPrice(booking.total)} />
        <Line label="Status" value={STATUS_LABEL[accessState] || STATUS_LABEL.pending} />
      </dl>
    </motion.article>
  );
}
