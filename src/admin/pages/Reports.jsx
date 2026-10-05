import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FilterBar, { FilterSelect } from "../components/FilterBar";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import { adminQuery, adminRequest, downloadAdminExport } from "../services/adminService";
import { formatInr } from "../utils/adminHelpers";

const RANGES = [
  ["upcoming", "Upcoming / current"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["month", "This Month"],
  ["custom", "Custom Range"],
];

export default function Reports() {
  const { can, toast } = useAdminAuth();
  const [range, setRange] = useState("upcoming");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [rows, setRows] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const financial = can("reports");

  useEffect(() => {
    adminRequest("/admin/events").then((data) => setEvents(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setReport(null);
    const path = financial ? "/admin/reports/overview" : "/admin/reports/revenue";
    adminRequest(`${path}${adminQuery({ range, from, to, eventId })}`)
      .then((data) => active && setReport(data.report))
      .catch((err) => active && setError(err.message));
    if (financial) {
      adminRequest("/admin/reports/events").then((data) => active && setRows(data.data || [])).catch(() => {});
      adminRequest("/admin/reports/integrity").then((data) => active && setIntegrity(data.integrity)).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [range, from, to, eventId, financial]);

  async function exportType(type) {
    setBusy(type);
    try {
      await downloadAdminExport(type, { range, from, to, eventId });
      toast("Export ready");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminPageHeader title="Reports" subtitle="Figures are calculated on the server." />
      <FilterBar>
        <FilterSelect label="Date range" value={range} onChange={setRange} options={RANGES.map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Event" value={eventId} onChange={setEventId} options={[{ value: "", label: "All events" }, ...events.map((event) => ({ value: event.eventId, label: event.number }))]} />
        {range === "custom" ? (
          <>
            <input aria-label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" />
            <input aria-label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" />
          </>
        ) : null}
      </FilterBar>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {!report && !error ? <div className="mt-4"><LoadingSkeleton variant="cards" /></div> : null}
      {report ? (
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {financial ? (
            <>
              <StatCard title="Total Revenue" value={formatInr(report.grossRevenue)} />
              <StatCard title="Net Revenue" value={formatInr(report.netRevenue)} detail={`Refunded ${formatInr(report.refundedRevenue)}`} />
              <StatCard title="Bookings" value={report.rangeBookings ?? report.totalBookings} />
              <StatCard title="Passes Sold" value={report.rangePasses ?? report.bookedPasses} />
              <StatCard title="Payment Verification Rate" value={report.paidPayments + report.verificationPending ? `${Math.round((report.paidPayments / (report.paidPayments + report.verificationPending)) * 100)}%` : "0%"} />
              <StatCard title="Check-In Rate" value={`${report.checkInRate}%`} />
              <StatCard title="Refunds" value={formatInr(report.refundedRevenue)} />
              <StatCard title="Cancelled Bookings" value={report.cancelledBookings} />
            </>
          ) : (
            <>
              <StatCard title="Gross Revenue" value={formatInr(report.grossRevenue)} />
              <StatCard title="Refunded" value={formatInr(report.refundedRevenue)} />
              <StatCard title="Net Revenue" value={formatInr(report.netRevenue)} />
            </>
          )}
        </section>
      ) : null}
      {financial && integrity ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm text-text-secondary">Data integrity</h2>
          {integrity.ok ? (
            <p className="mt-2 text-sm">No integrity issues.</p>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-semibold text-warning">Data Integrity Issue</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {integrity.issues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>{issue.code}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : null}
      {financial ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm text-text-secondary">Event Performance</h2>
          {rows.length ? (
            <DataTable
              rowKey="eventId"
              rows={rows}
              columns={[
                { key: "number", label: "Event" },
                { key: "capacity", label: "Capacity" },
                { key: "passesSold", label: "Passes Sold" },
                { key: "remaining", label: "Remaining" },
                { key: "bookings", label: "Bookings" },
                { key: "revenue", label: "Revenue", render: (row) => formatInr(row.revenue) },
                { key: "averageBookingSize", label: "Average Booking Size" },
                { key: "verificationPending", label: "Verification Pending" },
                { key: "confirmed", label: "Confirmed" },
                { key: "cancelled", label: "Cancelled" },
                { key: "checkedIn", label: "Checked In" },
                { key: "checkInRate", label: "Check-In Rate", render: (row) => `${row.checkInRate}%` },
              ]}
            />
          ) : (
            <EmptyState title="No events to report." />
          )}
        </section>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {(financial ? ["bookings", "payments", "check-ins", "events"] : ["payments"]).map((type) => (
          <button key={type} type="button" disabled={Boolean(busy)} onClick={() => exportType(type)} className="rounded-xl border border-border px-3 py-2 text-sm capitalize disabled:opacity-60">
            {busy === type ? "Exporting..." : `Export ${type}`}
          </button>
        ))}
      </div>
    </div>
  );
}
