import { useEffect, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable, { ViewLink } from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import SearchInput from "../components/SearchInput";
import { adminQuery, adminRequest } from "../services/adminService";
import { formatInr, formatWhen, useDebounced } from "../utils/adminHelpers";

export default function Customers() {
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setResult(null);
    adminRequest(`/admin/customers${adminQuery({ q: query, page, limit })}`)
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [query, page, limit]);

  return (
    <div>
      <AdminPageHeader title="Customers" subtitle="Grouped from bookings. Profiles are not edited here." />
      <div className="mb-4">
        <SearchInput value={q} onChange={(value) => { setPage(1); setQ(value); }} placeholder="Name, email, mobile, or booking ID" />
      </div>
      {error ? <ErrorState message={error} /> : null}
      {!result && !error ? <LoadingSkeleton /> : null}
      {result && !result.data.length ? <EmptyState title="No customers yet." /> : null}
      {result?.data?.length ? (
        <div className="space-y-4">
          <DataTable
            rowKey="customerId"
            rows={result.data}
            columns={[
              { key: "name", label: "Customer Name" },
              { key: "email", label: "Email" },
              { key: "mobile", label: "Mobile" },
              { key: "bookings", label: "Total Bookings" },
              { key: "passes", label: "Total Passes" },
              { key: "paid", label: "Total Paid", render: (row) => formatInr(row.paid) },
              { key: "lastBookingAt", label: "Last Booking", render: (row) => formatWhen(row.lastBookingAt, true) },
              { key: "actions", label: "Status", render: (row) => <ViewLink to={`/admin/customers/${row.customerId}`}>View</ViewLink> },
            ]}
          />
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={limit} onPage={setPage} onLimit={(value) => { setPage(1); setLimit(value); }} />
        </div>
      ) : null}
    </div>
  );
}
