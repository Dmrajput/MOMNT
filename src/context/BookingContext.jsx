import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getEventById } from "../data/events";
import { useAuth } from "./AuthContext";
import { createBooking } from "../services/bookingService";
import {
  calculateBookingFee,
  calculateSubtotal,
  calculateTotal,
  clampQuantity,
  clearStoredDraft,
  getStoredBooking,
  isDraftExpired,
  readDraft,
  saveDraft,
} from "../utils/booking";
import { normalizeMobile } from "../utils/validation";

const BookingContext = createContext(null);

const emptyCustomer = { name: "", mobile: "", email: "" };

function emptyState() {
  return {
    event: null,
    quantity: 1,
    attendees: [],
    guestNames: "",
    customer: { ...emptyCustomer },
    termsAccepted: false,
    bookingId: null,
    status: "draft",
  };
}

function toDraft(state) {
  return {
    eventId: state.event.id,
    quantity: state.quantity,
    customer: state.customer,
    guestNames: state.guestNames,
    attendees: state.attendees,
    termsAccepted: state.termsAccepted,
    status: state.status,
    updatedAt: new Date().toISOString(),
  };
}

function hydrate(draft, event) {
  return {
    event,
    quantity: clampQuantity(draft.quantity, event),
    attendees: draft.attendees ?? [],
    guestNames: draft.guestNames ?? "",
    customer: {
      name: draft.customer?.name ?? "",
      mobile: draft.customer?.mobile ?? "",
      email: draft.customer?.email ?? "",
    },
    termsAccepted: Boolean(draft.termsAccepted),
    bookingId: null,
    status: draft.status === "payment_pending" ? "draft" : draft.status || "draft",
  };
}

export function BookingProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(emptyState);
  const [completed, setCompleted] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredBooking();
    if (stored) setCompleted(stored);

    const draft = readDraft();
    if (draft && isDraftExpired(draft.updatedAt)) {
      clearStoredDraft();
      setSessionExpired(true);
    } else if (draft?.eventId) {
      const event = getEventById(draft.eventId);
      if (event) setState(hydrate(draft, event));
      else clearStoredDraft();
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setState((current) => ({
      ...current,
      customer: { name: user.name, mobile: user.mobile, email: user.email },
    }));
  }, [user]);

  useEffect(() => {
    if (!ready || !state.event || state.status === "payment_pending") return;
    saveDraft(toDraft(state));
  }, [ready, state]);

  const totals = useMemo(() => {
    const subtotal = state.event
      ? calculateSubtotal(state.event.price, state.quantity)
      : 0;
    const bookingFee = calculateBookingFee();
    return { subtotal, bookingFee, total: calculateTotal(subtotal, bookingFee) };
  }, [state.event, state.quantity]);

  function startBooking(event) {
    setSessionExpired(false);
    setState((current) => {
      const sameEvent = current.event?.id === event.id;
      return {
        ...current,
        event,
        quantity: clampQuantity(sameEvent ? current.quantity : 1, event),
        status: "draft",
        bookingId: null,
      };
    });
  }

  function setEvent(event) {
    startBooking(event);
  }

  function setQuantity(quantity) {
    setState((current) => ({
      ...current,
      quantity: clampQuantity(quantity, current.event),
    }));
  }

  function setCustomer(customer) {
    setState((current) => ({
      ...current,
      customer: {
        ...current.customer,
        ...customer,
        mobile:
          customer.mobile === undefined
            ? current.customer.mobile
            : normalizeMobile(customer.mobile),
      },
    }));
  }

  function setAttendees(attendees, guestNames = "") {
    setState((current) => ({
      ...current,
      attendees,
      guestNames,
    }));
  }

  function setTermsAccepted(termsAccepted) {
    setState((current) => ({ ...current, termsAccepted }));
  }

  function setStatus(status) {
    setState((current) => ({ ...current, status }));
  }

  function clearBooking() {
    clearStoredDraft();
    setState(emptyState());
    setSessionExpired(false);
  }

  async function createLocalBooking() {
    if (!state.event) return null;
    const record = await createBooking({
      event: state.event,
      quantity: state.quantity,
      customer: state.customer,
      attendees: state.attendees,
      guestNames: state.guestNames,
    });
    clearStoredDraft();
    setCompleted(record);
    setState((current) => ({
      ...current,
      bookingId: record.bookingId,
      status: "payment_pending",
    }));
    return record;
  }

  const value = {
    ...state,
    ...totals,
    ready,
    completed,
    sessionExpired,
    setEvent,
    setQuantity,
    setCustomer,
    setAttendees,
    setTermsAccepted,
    setStatus,
    startBooking,
    calculateTotal: () => totals,
    createLocalBooking,
    clearBooking,
    dismissExpired() {
      setSessionExpired(false);
    },
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}
