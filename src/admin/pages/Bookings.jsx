import { useEffect, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable, { ViewLink } from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FilterBar, { FilterSelect } from "../components/FilterBar";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import SearchInput from "../components/SearchInput";
import StatusBadge from "../components/StatusBadge";
import { adminQuery, adminRequest } from "../services/adminService";
import { formatInr, formatWhen, useDebounced } from "../utils/adminHelpers";

const PAYMENT = ["", "pending", "verification_pending", "paid", "failed", "refunded"];
const BOOKING = ["", "created", "payment_pending", "payment_verification_pending", "confirmed", "cancelled", "expired", "refunded"];

export default function Bookings() {
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const [filters, setFilters] = useState({ eventId: "", paymentStatus: "", bookingStatus: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRequest("/admin/events").then((data) => setEvents(data.data || [])).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    let active = true;
    setResult(null);
    adminRequest(`/admin/bookings${adminQuery({ q: query, page, limit, ...filters })}`)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [query, page, limit, filters]);

  function setFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div>
      <AdminPageHeader title="Bookings" subtitle="Search is handled on the server." />
      <div className="mb-4 space-y-3">
        <SearchInput value={q} onChange={(value) => { setPage(1); setQ(value); }} placeholder="Booking ID, name, email, mobile, ticket, UTR" />
        <FilterBar>
          <FilterSelect label="Event" value={filters.eventId} onChange={(value) => setFilter("eventId", value)} options={[{ value: "", label: "All events" }, ...events.map((event) => ({ value: event.eventId, label: event.number }))]} />
          <FilterSelect label="Payment Status" value={filters.paymentStatus} onChange={(value) => setFilter("paymentStatus", value)} options={PAYMENT.map((value) => ({ value, label: value ? value.replaceAll("_", " ") : "Any payment" }))} />
          <FilterSelect label="Booking Status" value={filters.bookingStatus} onChange={(value) => setFilter("bookingStatus", value)} options={BOOKING.map((value) => ({ value, label: value ? value.replaceAll("_", " ") : "Any booking" }))} />
          <input aria-label="From date" type="date" value={filters.from} onChange={(event) => setFilter("from", event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" />
          <input aria-label="To date" type="date" value={filters.to} onChange={(event) => setFilter("to", event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" />
        </FilterBar>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {!result && !error ? <LoadingSkeleton /> : null}
      {result && !result.data.length ? <EmptyState title="No booking activity yet." /> : null}
      {result?.data?.length ? (
        <div className="space-y-4">
          <DataTable
            rowKey="bookingId"
            rows={result.data}
            columns={[
              { key: "bookingId", label: "Booking ID" },
              { key: "customerName", label: "Customer" },
              { key: "event", label: "Event" },
              { key: "quantity", label: "Passes" },
              { key: "total", label: "Amount", render: (row) => formatInr(row.total) },
              { key: "paymentStatus", label: "Payment", render: (row) => <StatusBadge status={row.paymentStatus} /> },
              { key: "bookingStatus", label: "Booking Status", render: (row) => <StatusBadge status={row.bookingStatus} /> },
              { key: "createdAt", label: "Created", render: (row) => formatWhen(row.createdAt, true) },
              { key: "actions", label: "Actions", render: (row) => <ViewLink to={`/admin/bookings/${row.bookingId}`} /> },
            ]}
          />
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={limit} onPage={setPage} onLimit={(value) => { setPage(1); setLimit(value); }} />
        </div>
      ) : null}
    </div>
  );
}
