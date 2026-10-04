import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PaymentStatusCard from "../components/payment/PaymentStatusCard";
import Button from "../components/ui/Button";
import { getBookingPaymentStatus } from "../services/paymentService";
import { getTicketByBooking } from "../services/ticketService";
import usePageMeta from "../utils/usePageMeta";

const TERMINAL = new Set(["paid", "failed", "expired", "cancelled"]);

export default function PaymentStatus() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [ticketId, setTicketId] = useState("");
  const [accessError, setAccessError] = useState(false);

  usePageMeta({
    title: "Payment Status — MOMNT",
    description: "Track verification of your MOMNT payment.",
  });

  useEffect(() => {
    let stopped = false;
    let timer;

    async function load() {
      try {
        const next = await getBookingPaymentStatus(bookingId);
        if (stopped) return;
        setStatus(next);
        setError(null);
        if (!TERMINAL.has(next.paymentStatus)) {
          timer = window.setTimeout(load, 8000);
        }
      } catch (requestError) {
        if (!stopped) setError(requestError);
      }
    }

    load();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [bookingId]);

  useEffect(() => {
    if (status?.paymentStatus !== "paid" || status?.bookingStatus !== "confirmed") return undefined;
    let stopped = false;
    getTicketByBooking(bookingId)
      .then((ticket) => {
        if (!stopped) setTicketId(ticket.ticketId);
      })
      .catch(() => {
        if (!stopped) setAccessError(true);
      });
    return () => {
      stopped = true;
    };
  }, [bookingId, status?.paymentStatus, status?.bookingStatus]);

  function tryAgain() {
    sessionStorage.removeItem(`momnt_payment_idempotency:${bookingId}`);
    navigate("/payment");
  }

  return (
    <div>
      {!status && !error ? (
        <div className="mx-auto h-72 max-w-xl animate-pulse rounded-[20px] border border-border bg-card" />
      ) : null}
      {error ? (
        <div className="mx-auto max-w-xl rounded-[16px] border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold text-white">
            {error.code === "BOOKING_NOT_FOUND" ? "Booking not found." : "Unable to connect to MOMNT. Please try again."}
          </h1>
          <p className="mt-3 text-sm text-text-secondary">{error.message}</p>
          <Button to="/experiences" className="mt-6">
            Explore Experiences
          </Button>
        </div>
      ) : null}
      {status ? (
        <>
          <PaymentStatusCard status={status} />
          <div className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3">
            {status.paymentStatus === "verification_pending" ? (
              <Button to="/booking/success" size="lg" fullWidth>
                View Booking
              </Button>
            ) : null}
            {status.paymentStatus === "payment_initiated" || status.paymentStatus === "pending" ? (
              <Button to="/payment" size="lg" arrow fullWidth>
                Continue to Payment
              </Button>
            ) : null}
            {status.paymentStatus === "paid" && status.bookingStatus === "confirmed" ? (
              <>
                <p className="text-center text-sm text-text-secondary">Your MOMNT access is ready.</p>
                {accessError ? (
                  <p className="text-center text-sm text-text-secondary" role="status">
                    Unable to load your MOMNT access. Please try again.
                  </p>
                ) : (
                  <Button to={ticketId ? `/ticket/${ticketId}` : undefined} disabled={!ticketId} size="lg" arrow fullWidth>
                    View MOMNT Access
                  </Button>
                )}
              </>
            ) : null}
            {status.paymentStatus === "failed" ? (
              <Button size="lg" fullWidth onClick={tryAgain}>
                Try Payment Again
              </Button>
            ) : null}
            {status.paymentStatus === "expired" || status.paymentStatus === "cancelled" ? (
              <Button to="/experiences/premium-sunday-experience" size="lg" fullWidth>
                Return to Booking
              </Button>
            ) : null}
            <Button to="/" variant="outline" fullWidth>
              Back to Home
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
