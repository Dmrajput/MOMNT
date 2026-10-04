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
import { actionLabel, formatWhen } from "../utils/adminHelpers";

export default function TicketDetails() {
  const { ticketId } = useParams();
  const { can, toast } = useAdminAuth();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return adminRequest(`/admin/tickets/${ticketId}`)
      .then((data) => setTicket(data.ticket))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, [ticketId]);

  async function confirm() {
    setBusy(true);
    try {
      if (mode === "check-in") {
        await adminRequest(`/admin/tickets/${ticketId}/check-in`, { method: "POST", body: {} });
        toast("Ticket checked in");
      } else {
        await adminRequest(`/admin/tickets/${ticketId}/cancel`, { method: "POST", body: { reason: "Cancelled by admin" } });
        toast("Ticket cancelled");
      }
      setMode("");
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ticket && !error) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  const customer = ticket.customer || {};

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Tickets", to: "/admin/tickets" }, { label: ticket.ticketId }]} />
      <AdminPageHeader title={ticket.ticketNumber || ticket.ticketId} actions={<StatusBadge status={ticket.status} />} />
      <section className="max-w-2xl space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <p>Ticket ID · {ticket.ticketId}</p>
        <p>Booking · {ticket.bookingReference ? <Link className="text-pink" to={`/admin/bookings/${ticket.bookingReference}`}>{ticket.bookingReference}</Link> : "—"}</p>
        <p>Customer · {customer.name}</p>
        {customer.email ? <p>Email · {customer.email}</p> : null}
        {customer.mobile ? <p>Mobile · {customer.mobile}</p> : null}
        <p>Event · {ticket.event?.title}</p>
        <p>Date · {ticket.event?.date}</p>
        <p>Passes · {ticket.quantity}</p>
        <p>Issued · {formatWhen(ticket.issuedAt, true)}</p>
        <p>Checked in · {formatWhen(ticket.checkedInAt, true)}</p>
      </section>
      <div className="mt-5 flex flex-wrap gap-3">
        {can("check_in") && ticket.status === "active" ? (
          <button type="button" className="rounded-xl bg-gradient-to-r from-orange to-pink px-4 py-2 text-sm font-semibold" onClick={() => setMode("check-in")}>
            Check In
          </button>
        ) : null}
        {can("tickets_cancel") && ticket.status === "active" ? (
          <button type="button" className="rounded-xl border border-danger px-4 py-2 text-sm text-danger" onClick={() => setMode("cancel")}>
            Cancel
          </button>
        ) : null}
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-sm text-text-secondary">Activity</h2>
        {ticket.activity?.length ? (
          <ol className="space-y-2 text-sm">
            {ticket.activity.map((item) => (
              <li key={`${item.action}-${item.at}`}>
                {formatWhen(item.at, true)} · {actionLabel(item.action)}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-text-muted">No admin activity yet.</p>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(mode)}
        title={mode === "check-in" ? "Confirm Check-In" : "Cancel this ticket?"}
        description={mode === "check-in" ? `${customer.name} · ${ticket.quantity} passes` : "A cancelled ticket cannot be used for entry."}
        confirmLabel={mode === "check-in" ? "Confirm Check-In" : "Cancel Ticket"}
        busyLabel={mode === "check-in" ? "Checking In..." : "Cancelling..."}
        danger={mode === "cancel"}
        busy={busy}
        onClose={() => setMode("")}
        onConfirm={confirm}
      />
    </div>
  );
}
