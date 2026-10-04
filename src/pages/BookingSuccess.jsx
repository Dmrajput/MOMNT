import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import BookingSuccessCard from "../components/booking/BookingSuccessCard";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import { getBookingPaymentStatus } from "../services/paymentService";
import { getTicketByBooking } from "../services/ticketService";
import usePageMeta from "../utils/usePageMeta";

export default function BookingSuccess() {
  const { ready, completed } = useBooking();
  const [live, setLive] = useState(null);
  const [ticketId, setTicketId] = useState("");

  usePageMeta({
    title: "Booking Created — MOMNT",
    description: "Your MOMNT booking is created and payment is pending.",
  });

  useEffect(() => {
    const bookingId = completed?.bookingId;
    if (!bookingId) return undefined;
    let stopped = false;
    getBookingPaymentStatus(bookingId)
      .then(async (status) => {
        if (stopped) return;
        setLive(status);
        if (status.paymentStatus === "paid" && status.bookingStatus === "confirmed") {
          const ticket = await getTicketByBooking(bookingId);
          if (!stopped) setTicketId(ticket.ticketId);
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, [completed?.bookingId]);

  if (!ready) return null;
  if (!completed) return <Navigate to="/booking" replace />;

  const accessState =
    live?.paymentStatus === "paid" && live?.bookingStatus === "confirmed"
      ? "confirmed"
      : live?.paymentStatus === "verification_pending"
        ? "verification_pending"
        : "pending";

  return (
    <div>
      <BookingSuccessCard booking={completed} accessState={accessState} />
      <div className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-4">
        {accessState === "confirmed" ? (
          <Button to={ticketId ? `/ticket/${ticketId}` : undefined} disabled={!ticketId} size="lg" arrow fullWidth>
            View Your MOMNT Access
          </Button>
        ) : (
          <Button to="/payment" size="lg" arrow fullWidth>
            Continue to Payment
          </Button>
        )}
        <p className="text-sm leading-relaxed text-text-secondary">
          {accessState === "confirmed"
            ? "Your MOMNT access is ready."
            : "Your booking is confirmed only after MOMNT verifies the payment."}
        </p>
        <Button to="/" variant="outline" fullWidth>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
