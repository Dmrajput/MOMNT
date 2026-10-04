import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, Ticket, Users, CalendarDays } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminPageHeader from "../components/AdminPageHeader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { adminQuery, adminRequest } from "../services/adminService";
import { formatInr, formatTime, formatWhen, greeting } from "../utils/adminHelpers";

function upcomingEventId(events) {
  const now = Date.now();
  const upcoming = (events || []).find((event) => event.status === "published" && new Date(event.date).getTime() >= now);
  return upcoming?.eventId || events?.[0]?.eventId || "all";
}

function Bars({ rows, valueKey, empty }) {
  const max = Math.max(...rows.map((row) => row[valueKey] || 0), 0);
  if (!max) return <EmptyState title={empty} />;
  return (
    <div className="flex h-36 items-end gap-1">
      {rows.map((row) => (
        <div key={row.date} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-orange to-pink"
            style={{ height: `${Math.max(8, ((row[valueKey] || 0) / max) * 100)}%` }}
            title={`${row.date}: ${row[valueKey]}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { admin } = useAdminAuth();
  const [eventId, setEventId] = useState("");
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminRequest(`/admin/dashboard${adminQuery({ eventId: eventId || undefined })}`)
      .then((data) => {
        if (!active) return;
        setPayload(data);
        setError("");
        if (!eventId) setEventId(upcomingEventId(data.events));
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
  }, [eventId]);

  const stats = payload?.stats;
  const weekRevenue = useMemo(() => {
    const rows = payload?.series?.bookingsOverTime || [];
    return rows.reduce((sum, row) => sum + (row.revenue || 0), 0);
  }, [payload]);

  if (loading && !payload) return <LoadingSkeleton variant="cards" />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  const selected = payload.events.find((event) => event.eventId === eventId);

  return (
    <div>
      <AdminPageHeader
        title={greeting(admin?.name)}
        subtitle="Here's what's happening with MOMNT."
        actions={
          <label className="text-sm text-text-secondary">
            <span className="mr-2">Select Event</span>
            <select
              aria-label="Select Event"
              value={eventId || "all"}
              onChange={(event) => setEventId(event.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-white"
            >
              <option value="all">All Events</option>
              {payload.events.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.number}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Events" value={stats.totalEvents} icon={CalendarDays} />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={CalendarDays} />
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={Users} />
        <StatCard title="Confirmed Bookings" value={stats.confirmedBookings} icon={Users} />
        <StatCard title="Pending Payments" value={stats.verificationPending} detail={`${stats.pendingPayments} awaiting payment or review`} />
        <StatCard
          title="Revenue"
          value={formatInr(stats.netRevenue)}
          detail={weekRevenue ? `${formatInr(weekRevenue)} in the recent window` : "Gross paid bookings"}
          icon={IndianRupee}
        />
        <StatCard title="Tickets Issued" value={stats.ticketsIssued} icon={Ticket} />
        <StatCard title="Checked In" value={stats.checkedIn} detail={`${stats.checkInRate}% of issued passes`} />
      </section>

      {selected ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Capacity", stats.capacity],
            ["Booked", stats.bookedPasses],
            ["Remaining", stats.remainingPasses],
            ["Revenue", formatInr(stats.netRevenue)],
            ["Checked In", stats.checkedInPasses],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-border bg-card-elevated px-4 py-3">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <h2 className="text-lg font-semibold">Needs Attention</h2>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          <li>{stats.verificationPending} Payments Awaiting Verification</li>
          <li>{stats.cancelledBookings} Cancelled Bookings</li>
          <li>{stats.cancelledTickets} Tickets Needing Review</li>
        </ul>
        <Link to="/admin/payments?status=verification_pending" className="mt-4 inline-block text-sm font-semibold text-pink">
          Review Payments →
        </Link>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Bookings Over Time</h2>
          <Bars rows={payload.series.bookingsOverTime} valueKey="bookings" empty="No booking activity yet." />
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Revenue Over Time</h2>
          <Bars rows={payload.series.bookingsOverTime} valueKey="revenue" empty="No booking activity yet." />
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Payment Status</h2>
          {payload.series.paymentStatus.length ? (
            <ul className="space-y-2 text-sm">
              {payload.series.paymentStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between">
                  <StatusBadge status={row.status} />
                  <span>{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No booking activity yet." />
          )}
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Check-In Progress</h2>
          <p className="text-3xl font-semibold">
            {stats.checkedInPasses} / {stats.bookedPasses || stats.capacity}
          </p>
          <p className="mt-1 text-sm text-text-muted">{stats.checkInRate}% checked in</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Activity title="Recent Bookings" empty="No booking activity yet." rows={payload.activity.bookings} render={(row) => (
          <Link to={`/admin/bookings/${row.bookingId}`} className="block rounded-xl border border-border px-3 py-3 hover:border-pink">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{row.bookingId}</p>
              <StatusBadge status={row.bookingStatus} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {row.customerName} · {row.quantity} passes · {formatInr(row.total)}
            </p>
          </Link>
        )} />
        <Activity title="Recent Payment Submissions" empty="No payments awaiting review." rows={payload.activity.paymentSubmissions} render={(row) => (
          <Link to={`/admin/payments/${row.paymentId}`} className="block rounded-xl border border-border px-3 py-3">
            <p className="font-medium">{row.paymentId}</p>
            <p className="text-sm text-text-secondary">{row.bookingId} · {formatInr(row.amount)}</p>
          </Link>
        )} />
        <Activity title="Recent Payment Verifications" empty="No verified payments yet." rows={payload.activity.paymentVerifications} render={(row) => (
          <Link to={`/admin/payments/${row.paymentId}`} className="block rounded-xl border border-border px-3 py-3">
            <p className="font-medium">{row.paymentId}</p>
            <p className="text-sm text-text-secondary">{formatWhen(row.verifiedAt, true)}</p>
          </Link>
        )} />
        <Activity title="Recent Check-ins" empty="No check-ins yet." rows={payload.activity.checkIns} render={(row) => (
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="font-medium">{row.customerName}</p>
            <p className="text-sm text-text-secondary">{row.quantity} passes · {formatTime(row.checkedInAt)}</p>
          </div>
        )} />
      </section>
    </div>
  );
}

function Activity({ title, rows, render, empty }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-text-secondary">{title}</h2>
      {rows?.length ? <div className="space-y-2">{rows.map((row) => <div key={row.bookingId || row.paymentId || row.ticketId}>{render(row)}</div>)}</div> : <EmptyState title={empty} />}
    </section>
  );
}
