import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTicketValidationPreview } from "../services/ticketService";
import usePageMeta from "../utils/usePageMeta";

const COPY = {
  INVALID_QR_TOKEN: {
    title: "Invalid access",
    message: "This access code is not valid.",
  },
  ALREADY_CHECKED_IN: {
    title: "Already Checked In",
    message: "This MOMNT access has already been used.",
  },
  TICKET_CANCELLED: {
    title: "Ticket Cancelled",
    message: "This MOMNT access is no longer valid.",
  },
  TICKET_REFUNDED: {
    title: "Ticket Refunded",
    message: "This ticket cannot be used for event entry.",
  },
  TICKET_EXPIRED: {
    title: "Event Ended",
    message: "This MOMNT access has expired because the event has ended.",
  },
  EVENT_ENDED: {
    title: "Event Ended",
    message: "This MOMNT access has expired because the event has ended.",
  },
};

function formatCheckedIn(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default function TicketValidation() {
  const { qrToken } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  usePageMeta({
    title: "Validate MOMNT Access",
    description: "Validation result for MOMNT access.",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    let stopped = false;
    getTicketValidationPreview(qrToken)
      .then((next) => {
        if (!stopped) setResult(next);
      })
      .catch((requestError) => {
        if (!stopped) setError(requestError);
      });
    return () => {
      stopped = true;
    };
  }, [qrToken]);

  const copy = result?.valid ? null : COPY[result?.code] || COPY.INVALID_QR_TOKEN;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
      <Link to="/" className="text-sm font-extrabold tracking-[0.22em] text-white">
        MOMNT
      </Link>
      {!result && !error ? (
        <div className="mt-8 h-56 animate-pulse rounded-[20px] border border-border bg-card" role="status" aria-label="Checking access" />
      ) : null}
      {error ? (
        <h1 className="mt-8 text-3xl font-extrabold text-white" role="alert">
          Unable to load your MOMNT access. Please try again.
        </h1>
      ) : null}
      {result?.valid ? (
        <section className="mt-8 rounded-[20px] border border-border bg-card p-6" role="status">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">Valid access</p>
          <h1 className="mt-3 text-3xl font-extrabold text-white">{result.ticket.eventName}</h1>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Guest</dt>
              <dd className="font-medium text-white">{result.ticket.customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Passes</dt>
              <dd className="font-medium text-white">{result.ticket.quantity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Ticket</dt>
              <dd className="font-medium text-white">{result.ticket.ticketId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Date</dt>
              <dd className="font-medium text-white">{result.ticket.eventDate}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-text-secondary">Entry is confirmed only by MOMNT staff at the event.</p>
        </section>
      ) : null}
      {result && !result.valid ? (
        <section className="mt-8 rounded-[20px] border border-border bg-card p-6" role="status">
          <h1 className="text-3xl font-extrabold text-white">{copy.title}</h1>
          <p className="mt-3 text-text-secondary">{copy.message}</p>
          {result.ticket?.ticketId ? (
            <p className="mt-6 text-sm text-white">Ticket: {result.ticket.ticketId}</p>
          ) : null}
          {result.ticket?.checkedInAt ? (
            <p className="mt-2 text-sm text-white">Checked in at: {formatCheckedIn(result.ticket.checkedInAt)}</p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
