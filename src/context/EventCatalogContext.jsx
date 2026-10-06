import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient";
import { fallbackCatalog, presentCatalogEvent } from "../services/eventCatalog";

const EventCatalogContext = createContext(null);

export function EventCatalogProvider({ children }) {
  const [events, setEvents] = useState(() => fallbackCatalog());
  const [settled, setSettled] = useState(false);

  const load = useCallback((isActive = () => true) => {
    return apiRequest("/events")
      .then((data) => {
        if (!isActive()) return;
        setEvents((data.events || []).map(presentCatalogEvent));
        setSettled(true);
      })
      .catch(() => {
        if (isActive()) setSettled(true);
      });
  }, []);

  useEffect(() => {
    let active = true;
    load(() => active);
    function onFocus() {
      if (active) load(() => active);
    }
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const value = useMemo(() => {
    function getBySlug(slug) {
      return events.find((event) => event.slug === slug) ?? null;
    }
    function getById(id) {
      return events.find((event) => event.id === id) ?? null;
    }
    return {
      events,
      settled,
      featured: events[0] ?? null,
      getBySlug,
      getById,
    };
  }, [events, settled]);

  return <EventCatalogContext.Provider value={value}>{children}</EventCatalogContext.Provider>;
}

export function useEventCatalog() {
  const context = useContext(EventCatalogContext);
  if (!context) {
    throw new Error("useEventCatalog must be used within EventCatalogProvider");
  }
  return context;
}
