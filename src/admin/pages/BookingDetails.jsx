import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminBreadcrumbs from "../components/AdminBreadcrumbs";
import AdminPageHeader from "../components/AdminPageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatusBadge from "../components/StatusBadge";
import { adminRequest } from "../services/adminService";
import { formatInr, formatWhen } from "../utils/adminHelpers";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-right text-white">{value || "—"}</span>
    </div>
  );
}

export default function BookingDetails() {
  const { bookingId } = useParams();
  const { can, toast } = useAdminAuth();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    return adminRequest(`/admin/bookings/${bookingId}`)
      .then((data) => setBooking(data.booking))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, [bookingId]);

  async function cancel() {
    setBusy(true);
    try {
      await adminRequest(`/admin/bookings/${bookingId}/cancel`, { method: "POST", body: {} });
      toast("Booking cancelled");
      setConfirm(false);
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!booking && !error) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Bookings", to: "/admin/bookings" }, { label: booking.bookingId }]} />
      <AdminPageHeader
        title={booking.bookingId}
        subtitle={formatWhen(booking.createdAt, true)}
        actions={
          <>
            <StatusBadge status={booking.bookingStatus} />
            <StatusBadge status={booking.paymentStatus} />
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Customer</h2>
          <Row label="Name" value={booking.customer?.name} />
          <Row label="Email" value={booking.customer?.email} />
          <Row label="Mobile" value={booking.customer?.mobile} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Event</h2>
          <Row label="Event" value={booking.event?.title} />
          <Row label="Date" value={formatWhen(booking.event?.date)} />
          <Row label="Time" value={booking.event ? `${booking.event.startTime} – ${booking.event.endTime}` : ""} />
          <Row label="Location" value={booking.event?.location} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Pricing</h2>
          <Row label="Passes" value={booking.quantity} />
          <Row label="Subtotal" value={formatInr(booking.subtotal)} />
          <Row label="Booking Fee" value={formatInr(booking.bookingFee)} />
          <Row label="Total" value={formatInr(booking.total)} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Payment</h2>
          <Row label="Payment ID" value={booking.payment?.paymentId} />
          <Row label="UTR" value={booking.payment?.utr} />
          <Row label="Status" value={booking.payment?.status} />
          <Row label="Submitted" value={formatWhen(booking.payment?.submittedAt, true)} />
          <Row label="Verified" value={formatWhen(booking.payment?.verifiedAt, true)} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 font-medium">Ticket</h2>
          <Row label="Ticket ID" value={booking.ticket?.ticketId} />
          <Row label="Ticket Number" value={booking.ticket?.ticketNumber} />
          <Row label="Status" value={booking.ticket?.status} />
        </section>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {booking.payment ? <Link className="text-sm font-semibold text-pink" to={`/admin/payments/${booking.payment.paymentId}`}>View payment</Link> : null}
        {booking.ticket ? <Link className="text-sm font-semibold text-pink" to={`/admin/tickets/${booking.ticket.ticketId}`}>View ticket</Link> : null}
        {can("bookings_cancel") && booking.bookingStatus !== "cancelled" ? (
          <button type="button" className="text-sm font-semibold text-danger" onClick={() => setConfirm(true)}>
            Cancel booking
          </button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirm}
        title="Cancel this booking?"
        description="Paid amounts are not refunded from this screen."
        confirmLabel="Cancel Booking"
        busyLabel="Cancelling..."
        danger
        busy={busy}
        onClose={() => setConfirm(false)}
        onConfirm={cancel}
      />
    </div>
  );
}
