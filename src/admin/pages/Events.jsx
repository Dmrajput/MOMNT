import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminPageHeader from "../components/AdminPageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { ViewLink } from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatusBadge from "../components/StatusBadge";
import { adminRequest } from "../services/adminService";
import { formatInr, formatWhen } from "../utils/adminHelpers";

export default function Events() {
  const { can, toast } = useAdminAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setError("");
    return adminRequest("/admin/events")
      .then((data) => setEvents(data.data))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction() {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === "cancel") {
        await adminRequest(`/admin/events/${pending.event.eventId}/cancel`, { method: "POST", body: {} });
        toast("Event cancelled");
      } else if (pending.type === "duplicate") {
        const data = await adminRequest(`/admin/events/${pending.event.eventId}/duplicate`, { method: "POST", body: {} });
        toast("Event duplicated");
        navigate(`/admin/events/${data.event.eventId}`);
        return;
      } else {
        const status = pending.event.status === "published" ? "draft" : "published";
        await adminRequest(`/admin/events/${pending.event.eventId}`, { method: "PATCH", body: { status } });
        toast("Event updated");
      }
      setPending(null);
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!events && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Events"
        subtitle="Published experiences available for booking."
        actions={
          can("events_write") ? (
            <Link to="/admin/events/new" className="rounded-xl bg-gradient-to-r from-orange to-pink px-4 py-2 text-sm font-semibold">
              Create Event
            </Link>
          ) : null
        }
      />
      {events.length ? (
        <DataTable
          rowKey="eventId"
          rows={events}
          columns={[
            { key: "number", label: "Event", render: (row) => <span className="font-medium">{row.number}</span> },
            { key: "date", label: "Date", render: (row) => formatWhen(row.date) },
            { key: "location", label: "Location" },
            { key: "price", label: "Price", render: (row) => formatInr(row.price) },
            { key: "capacity", label: "Capacity" },
            { key: "booked", label: "Booked", render: (row) => row.bookedQuantity },
            { key: "revenue", label: "Revenue", render: (row) => formatInr(row.revenue) },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-3">
                  <ViewLink to={`/admin/events/${row.eventId}`} />
                  {can("events_write") ? <ViewLink to={`/admin/events/${row.eventId}`}>Edit</ViewLink> : null}
                  {can("events_write") ? (
                    <button type="button" className="text-sm text-text-secondary" onClick={() => setPending({ type: "duplicate", event: row })}>
                      Duplicate
                    </button>
                  ) : null}
                  {can("events_write") ? (
                    <button type="button" className="text-sm text-text-secondary" onClick={() => setPending({ type: "publish", event: row })}>
                      {row.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  ) : null}
                  {can("events_cancel") && row.status !== "cancelled" ? (
                    <button type="button" className="text-sm text-danger" onClick={() => setPending({ type: "cancel", event: row })}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState title="No events yet." detail="Create an event when you are ready to open bookings." />
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.type === "cancel" ? "Cancel Event" : pending?.type === "duplicate" ? "Duplicate this event?" : "Change event status?"}
        description={pending?.type === "cancel" ? "Existing bookings stay in the records. This does not delete the event." : "This change is saved on the event."}
        confirmLabel={pending?.type === "cancel" ? "Cancel Event" : "Confirm"}
        danger={pending?.type === "cancel"}
        busy={busy}
        busyLabel="Saving..."
        onClose={() => setPending(null)}
        onConfirm={runAction}
      />
    </div>
  );
}
