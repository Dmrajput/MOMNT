import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminBreadcrumbs from "../components/AdminBreadcrumbs";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { adminRequest } from "../services/adminService";
import { dateInputValue, formatInr } from "../utils/adminHelpers";

const EMPTY = {
  eventId: "",
  slug: "",
  number: "",
  title: "",
  location: "",
  date: "",
  startTime: "",
  endTime: "",
  price: "",
  capacity: "",
  description: "",
  inclusions: "",
  image: "",
  status: "draft",
};

export default function EventDetails() {
  const { eventId } = useParams();
  const creating = !eventId || eventId === "new";
  const navigate = useNavigate();
  const { can, toast } = useAdminAuth();
  const [form, setForm] = useState(EMPTY);
  const [booked, setBooked] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!creating);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (creating) return undefined;
    let active = true;
    adminRequest(`/admin/events/${eventId}`)
      .then((data) => {
        if (!active) return;
        const event = data.event;
        setBooked(event.bookedQuantity || 0);
        setRevenue(event.revenue || 0);
        setForm({
          ...EMPTY,
          ...event,
          date: dateInputValue(event.date),
          inclusions: (event.inclusions || []).join("\n"),
        });
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creating, eventId]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!can("events_write")) return;
    if (Number(form.capacity) < booked) {
      toast("Capacity cannot be lower than the passes already booked.");
      return;
    }
    setBusy(true);
    const body = {
      ...form,
      price: Number(form.price),
      capacity: Number(form.capacity),
      inclusions: form.inclusions,
    };
    try {
      const data = creating
        ? await adminRequest("/admin/events", { method: "POST", body })
        : await adminRequest(`/admin/events/${eventId}`, { method: "PATCH", body });
      toast(creating ? "Event created" : "Event updated");
      navigate(`/admin/events/${data.event.eventId}`, { replace: true });
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Events", to: "/admin/events" }, { label: creating ? "Create" : form.number || "Event" }]} />
      <AdminPageHeader
        title={creating ? "Create Event" : form.title || "Event"}
        subtitle={creating ? "New events start as drafts until you publish them." : `${booked} booked · ${formatInr(revenue)} revenue`}
      />
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        {[
          ["eventId", "Event ID", "text"],
          ["slug", "Slug", "text"],
          ["number", "Event Number", "text"],
          ["title", "Title", "text"],
          ["location", "Location", "text"],
          ["date", "Date", "date"],
          ["startTime", "Start Time", "text"],
          ["endTime", "End Time", "text"],
          ["price", "Price", "number"],
          ["capacity", "Capacity", "number"],
          ["image", "Image", "text"],
        ].map(([key, label, type]) => (
          <label key={key} className="text-sm text-text-secondary">
            {label}
            <input
              type={type}
              required={key !== "image"}
              value={form[key]}
              onChange={(event) => update(key, event.target.value)}
              placeholder={key.includes("Time") ? "11:00 AM" : ""}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white outline-none focus:border-pink"
            />
          </label>
        ))}
        <label className="text-sm text-text-secondary">
          Status
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white"
          >
            {["draft", "published", "sold_out", "cancelled", "completed", "archived"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-secondary md:col-span-2">
          Description
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white outline-none focus:border-pink"
          />
        </label>
        <label className="text-sm text-text-secondary md:col-span-2">
          Inclusions
          <textarea
            value={form.inclusions}
            onChange={(event) => update("inclusions", event.target.value)}
            rows={4}
            placeholder="One inclusion per line"
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-white outline-none focus:border-pink"
          />
        </label>
        {!creating ? (
          <p className="text-sm text-text-muted md:col-span-2">
            Changing the price is recorded in the audit log. Existing confirmed bookings keep their stored amount. Future bookings use the current price. Capacity cannot drop below {booked} booked passes.
          </p>
        ) : null}
        {can("events_write") ? (
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-orange to-pink px-4 py-3 text-sm font-semibold md:col-span-2 md:w-fit"
          >
            {busy ? "Saving..." : creating ? "Create Event" : "Save Event"}
          </button>
        ) : (
          <p className="text-sm text-text-muted">You can view this event. Editing is limited to event managers and admins.</p>
        )}
      </form>
    </div>
  );
}
