import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminBreadcrumbs from "../components/AdminBreadcrumbs";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable, { ViewLink } from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatusBadge from "../components/StatusBadge";
import { adminRequest } from "../services/adminService";
import { formatInr } from "../utils/adminHelpers";

export default function CustomerDetails() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminRequest(`/admin/customers/${customerId}`)
      .then((data) => active && setCustomer(data.customer))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [customerId]);

  if (!customer && !error) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Customers", to: "/admin/customers" }, { label: customer.name }]} />
      <AdminPageHeader title={customer.name} subtitle={`${customer.email} · ${customer.mobile}`} />
      <h2 className="mb-3 text-sm text-text-secondary">Booking history</h2>
      {customer.bookings.length ? (
        <DataTable
          rowKey="bookingId"
          rows={customer.bookings}
          columns={[
            { key: "bookingId", label: "Booking ID", render: (row) => <Link to={`/admin/bookings/${row.bookingId}`}>{row.bookingId}</Link> },
            { key: "event", label: "Event" },
            { key: "quantity", label: "Passes" },
            { key: "total", label: "Amount", render: (row) => formatInr(row.total) },
            { key: "paymentStatus", label: "Payment Status", render: (row) => <StatusBadge status={row.paymentStatus} /> },
            { key: "bookingStatus", label: "Booking Status", render: (row) => <StatusBadge status={row.bookingStatus} /> },
          ]}
        />
      ) : (
        <EmptyState title="No bookings." />
      )}
      <h2 className="mt-8 mb-3 text-sm text-text-secondary">Ticket history</h2>
      {customer.tickets.length ? (
        <DataTable
          rowKey="ticketId"
          rows={customer.tickets}
          columns={[
            { key: "ticketId", label: "Ticket ID", render: (row) => <ViewLink to={`/admin/tickets/${row.ticketId}`}>{row.ticketId}</ViewLink> },
            { key: "event", label: "Event" },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      ) : (
        <EmptyState title="No tickets." />
      )}
    </div>
  );
}
