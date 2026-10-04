import { useEffect } from "react";
import { useParams } from "react-router-dom";
import TicketActions from "../components/ticket/TicketActions";
import TicketCard from "../components/ticket/TicketCard";
import TicketError from "../components/ticket/TicketError";
import TicketFooter from "../components/ticket/TicketFooter";
import TicketHeader from "../components/ticket/TicketHeader";
import TicketSkeleton from "../components/ticket/TicketSkeleton";
import { TicketProvider, useTicket } from "../context/TicketContext";
import usePageMeta from "../utils/usePageMeta";

function TicketView() {
  const { ticketId } = useParams();
  const { ticket, loading, error, loadTicket, refreshTicket } = useTicket();

  usePageMeta({
    title: "MOMNT Access",
    description: "Your MOMNT access for the event.",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    loadTicket(ticketId);
  }, [loadTicket, ticketId]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a
        href="#ticket-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-[12px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <TicketHeader />
      <main id="ticket-main" className="px-5 pb-8 md:px-6">
        {loading && !ticket ? <TicketSkeleton /> : null}
        {error ? <TicketError error={error} onRetry={refreshTicket} /> : null}
        {ticket ? (
          <>
            <TicketCard ticket={ticket} />
            <TicketActions ticket={ticket} />
          </>
        ) : null}
      </main>
      <TicketFooter />
    </div>
  );
}

export default function Ticket() {
  return (
    <TicketProvider>
      <TicketView />
    </TicketProvider>
  );
}
