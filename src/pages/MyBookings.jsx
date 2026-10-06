import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import { apiRequest } from "../services/apiClient";
import { formatPrice } from "../utils/helpers";
import usePageMeta from "../utils/usePageMeta";

const PAYMENT_LABELS = {
  pending: "Payment pending",
  payment_initiated: "Payment started",
  verification_pending: "Waiting for approval",
  paid: "Approved",
  failed: "Not approved",
  expired: "Expired",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const BOOKING_LABELS = {
  created: "Created",
  payment_pending: "Reserved",
  payment_verification_pending: "Waiting for approval",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

function label(map, value) {
  return map[value] || value || "—";
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [busyId, setBusyId] = useState("");

  usePageMeta({
    title: "My Bookings — MOMNT",
    description: "View your MOMNT booking status.",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    let active = true;
    apiRequest("/bookings/mine")
      .then((data) => {
        if (active) setBookings(data.bookings || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load your bookings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function cancelBooking(bookingId) {
    setBusyId(bookingId);
    setError("");
    try {
      const data = await apiRequest(`/bookings/${bookingId}/cancel`, { method: "POST", body: {} });
      setBookings((current) => current.map((booking) => (booking.bookingId === bookingId ? data.booking : booking)));
      setPendingId("");
    } catch (err) {
      setError(err.message || "Unable to cancel this booking.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <Container className="py-12">
      <p className="text-sm font-semibold tracking-[0.22em] text-white">MOMNT</p>
      <h1 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Your bookings</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Status is updated from MOMNT. You can cancel only before the payment is approved.
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="mt-8 text-sm text-text-secondary">Loading your bookings...</p> : null}
      {!loading && !bookings.length ? (
        <div className="mt-8 rounded-[16px] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-white">You have no bookings yet.</p>
          <Link to="/experiences" className="mt-4 inline-block text-sm font-semibold text-pink">
            Reserve your MOMNT
          </Link>
        </div>
      ) : null}
      <ul className="mt-8 flex flex-col gap-4">
        {bookings.map((booking) => (
          <li key={booking.bookingId} className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.16em] text-text-muted uppercase">{booking.event?.number || "MOMNT"}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{booking.event?.title || "Experience"}</h2>
              </div>
              <p className="text-lg font-semibold text-white">{formatPrice(booking.total)}</p>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">Booking ID</dt>
                <dd className="text-white">{booking.bookingId}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Passes</dt>
                <dd className="text-white">{booking.quantity}</dd>
              </div>
              <div>
                <dt className="text-text-muted">When</dt>
                <dd className="text-white">{booking.event ? `${booking.event.date} · ${booking.event.time}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Location</dt>
                <dd className="text-white">{booking.event?.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Booking status</dt>
                <dd className="text-white">{label(BOOKING_LABELS, booking.bookingStatus)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Payment status</dt>
                <dd className="text-white">{label(PAYMENT_LABELS, booking.paymentStatus)}</dd>
              </div>
              {booking.guestNames ? (
                <div className="sm:col-span-2">
                  <dt className="text-text-muted">Guests</dt>
                  <dd className="text-white">{booking.guestNames}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {booking.canPay ? (
                <Button to="/payment" state={{ bookingId: booking.bookingId, quantity: booking.quantity }} size="sm" arrow>
                  Complete payment
                </Button>
              ) : null}
              {booking.canCancel ? (
                pendingId === booking.bookingId ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === booking.bookingId}
                      onClick={() => cancelBooking(booking.bookingId)}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                    >
                      {busyId === booking.bookingId ? "Cancelling..." : "Confirm cancel"}
                    </button>
                    <button type="button" onClick={() => setPendingId("")} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white">
                      Keep booking
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPendingId(booking.bookingId)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white">
                    Cancel booking
                  </button>
                )
              ) : (
                <p className="text-sm text-text-muted">
                  {booking.paymentStatus === "paid" || booking.bookingStatus === "confirmed"
                    ? "Payment is approved. This booking cannot be cancelled."
                    : "This booking cannot be cancelled."}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
