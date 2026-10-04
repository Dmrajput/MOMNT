import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getTicket } from "../services/ticketService";

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketId, setTicketId] = useState("");

  const loadTicket = useCallback(async (nextId) => {
    setTicketId(nextId);
    setLoading(true);
    setError(null);
    try {
      const next = await getTicket(nextId);
      setTicket(next);
      return next;
    } catch (requestError) {
      setTicket(null);
      setError(requestError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTicket = useCallback(async () => {
    if (!ticketId) return null;
    return loadTicket(ticketId);
  }, [loadTicket, ticketId]);

  const value = useMemo(
    () => ({ ticket, loading, error, loadTicket, refreshTicket }),
    [ticket, loading, error, loadTicket, refreshTicket],
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTicket() {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTicket must be used within TicketProvider");
  return context;
}
