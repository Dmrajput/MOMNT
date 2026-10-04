import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const STATUSES = ["verification_pending", "pending", "paid", "failed", "expired", "cancelled", "refunded", ""];

export default function Payments() {
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const [status, setStatus] = useState(params.get("status") || "verification_pending");
  const [eventId, setEventId] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRequest("/admin/events").then((data) => setEvents(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setResult(null);
    adminRequest(`/admin/payments${adminQuery({ q: query, status, eventId, method, page, limit })}`)
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [query, status, eventId, method, page, limit]);

  return (
    <div>
      <AdminPageHeader title="Payments" subtitle="Verification pending is the default queue." />
      <div className="mb-4 space-y-3">
        <SearchInput value={q} onChange={(value) => { setPage(1); setQ(value); }} placeholder="Payment, booking, or UTR" />
        <FilterBar>
          <FilterSelect label="Event" value={eventId} onChange={(value) => { setPage(1); setEventId(value); }} options={[{ value: "", label: "All events" }, ...events.map((event) => ({ value: event.eventId, label: event.number }))]} />
          <FilterSelect label="Payment Status" value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={STATUSES.map((value) => ({ value, label: value ? value.replaceAll("_", " ") : "All statuses" }))} />
          <FilterSelect label="Method" value={method} onChange={(value) => { setPage(1); setMethod(value); }} options={[{ value: "", label: "Any method" }, { value: "upi", label: "UPI" }]} />
        </FilterBar>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {!result && !error ? <LoadingSkeleton /> : null}
      {result && !result.data.length ? <EmptyState title="No payments in this view." /> : null}
      {result?.data?.length ? (
        <div className="space-y-4">
          <DataTable
            rowKey="paymentId"
            rows={result.data}
            columns={[
              { key: "paymentId", label: "Payment ID" },
              { key: "bookingId", label: "Booking" },
              { key: "customerName", label: "Customer" },
              { key: "amount", label: "Amount", render: (row) => formatInr(row.amount) },
              { key: "method", label: "Method" },
              { key: "utr", label: "UTR" },
              { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
              { key: "submittedAt", label: "Submitted", render: (row) => formatWhen(row.submittedAt || row.createdAt, true) },
              { key: "actions", label: "Actions", render: (row) => <ViewLink to={`/admin/payments/${row.paymentId}`} /> },
            ]}
          />
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={limit} onPage={setPage} onLimit={(value) => { setPage(1); setLimit(value); }} />
        </div>
      ) : null}
    </div>
  );
}
