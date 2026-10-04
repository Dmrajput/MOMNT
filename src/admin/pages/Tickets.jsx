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
import { formatWhen, useDebounced } from "../utils/adminHelpers";

const STATUSES = ["", "active", "checked_in", "cancelled", "refunded", "expired"];

export default function Tickets() {
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const [status, setStatus] = useState("");
  const [eventId, setEventId] = useState("");
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
    adminRequest(`/admin/tickets${adminQuery({ q: query, status, eventId, page, limit })}`)
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [query, status, eventId, page, limit]);

  return (
    <div>
      <AdminPageHeader title="Tickets" subtitle="One access pass is issued for each confirmed booking." />
      <div className="mb-4 space-y-3">
        <SearchInput value={q} onChange={(value) => { setPage(1); setQ(value); }} placeholder="Ticket ID, ticket number, or guest" />
        <FilterBar>
          <FilterSelect label="Event" value={eventId} onChange={(value) => { setPage(1); setEventId(value); }} options={[{ value: "", label: "All events" }, ...events.map((event) => ({ value: event.eventId, label: event.number }))]} />
          <FilterSelect label="Status" value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={STATUSES.map((value) => ({ value, label: value ? value.replaceAll("_", " ") : "All statuses" }))} />
        </FilterBar>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {!result && !error ? <LoadingSkeleton /> : null}
      {result && !result.data.length ? <EmptyState title="No tickets yet." /> : null}
      {result?.data?.length ? (
        <div className="space-y-4">
          <DataTable
            rowKey="ticketId"
            rows={result.data}
            columns={[
              { key: "ticketId", label: "Ticket ID" },
              { key: "ticketNumber", label: "Ticket Number" },
              { key: "customerName", label: "Customer" },
              { key: "event", label: "Event" },
              { key: "quantity", label: "Passes" },
              { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
              { key: "issuedAt", label: "Issued", render: (row) => formatWhen(row.issuedAt, true) },
              { key: "checkedInAt", label: "Checked In", render: (row) => formatWhen(row.checkedInAt, true) },
              { key: "actions", label: "Actions", render: (row) => <ViewLink to={`/admin/tickets/${row.ticketId}`} /> },
            ]}
          />
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={limit} onPage={setPage} onLimit={(value) => { setPage(1); setLimit(value); }} />
        </div>
      ) : null}
    </div>
  );
}
