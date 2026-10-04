import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Badge from "../ui/Badge";
import TicketCustomerInfo from "./TicketCustomerInfo";
import TicketDivider from "./TicketDivider";
import TicketEventInfo from "./TicketEventInfo";
import TicketQRCode from "./TicketQRCode";
import TicketStatusBadge from "./TicketStatusBadge";

const COPY = {
  active: {
    badge: "Confirmed Access",
    message: "",
  },
  checked_in: {
    badge: "Checked In",
    message: "Your MOMNT access has already been used.",
  },
  cancelled: {
    badge: "Access Cancelled",
    message: "This MOMNT access is no longer valid.",
  },
  refunded: {
    badge: "Access Refunded",
    message: "This access cannot be used for event entry.",
  },
  expired: {
    badge: "Event Ended",
    message: "This MOMNT access has expired because the event has ended.",
  },
};

function formatCheckedIn(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

const TicketCard = forwardRef(function TicketCard({ ticket }, ref) {
  const reduce = useReducedMotion();
  const copy = COPY[ticket.status] || COPY.active;
  const showQr = ticket.status === "active" || ticket.status === "checked_in";

  return (
    <motion.article
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-[960px] overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="relative min-h-[300px] min-w-0">
          <img src={ticket.event.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080D] via-[#08080D]/80 to-[#08080D]/25" />
          <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
            <p className="text-xs font-extrabold tracking-[0.22em] text-white">MOMNT</p>
            <p className="text-sm text-text-secondary">Make It A MOMNT.</p>
            <Badge className="mt-5 w-fit">{copy.badge}</Badge>
            <p className="mt-5 text-sm tracking-[0.14em] text-white/80">{ticket.event.number}</p>
            <h1 className="mt-2 text-[32px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[40px]">
              {ticket.event.title}
            </h1>
            <TicketEventInfo event={ticket.event} />
            <p className="mt-4 text-sm text-text-secondary">Limited Private Experience</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-between bg-[#11111A] p-6 md:p-8">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-pink uppercase">MOMNT Access</p>
            <p className="mt-2 text-sm text-text-secondary">{ticket.ticketNumber}</p>
            {copy.message ? (
              <p className="mt-4 text-sm leading-relaxed text-text-secondary" role="status">
                {copy.message}
              </p>
            ) : null}
            {ticket.status === "checked_in" && ticket.checkedInAt ? (
              <p className="mt-2 text-sm text-white">Checked in at: {formatCheckedIn(ticket.checkedInAt)}</p>
            ) : null}
            <TicketDivider />
            <TicketCustomerInfo ticket={ticket} />
          </div>
          {showQr ? (
            <motion.div
              className="mt-8"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
            >
              <TicketQRCode ticketId={ticket.ticketId} used={ticket.status === "checked_in"} />
            </motion.div>
          ) : null}
          <div className="mt-8">
            <TicketStatusBadge status={ticket.status} />
          </div>
        </div>
      </div>
    </motion.article>
  );
});

export default TicketCard;
