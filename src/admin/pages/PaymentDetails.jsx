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
import { actionLabel, formatInr, formatWhen } from "../utils/adminHelpers";

const REASONS = ["UTR not found", "Incorrect amount", "Duplicate transaction", "Wrong account", "Suspicious payment", "Other"];

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="max-w-[60%] text-right text-white">{value || "—"}</span>
    </div>
  );
}

export default function PaymentDetails() {
  const { paymentId } = useParams();
  const { can, toast } = useAdminAuth();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return adminRequest(`/admin/payments/${paymentId}`)
      .then((data) => setPayment(data.payment))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, [paymentId]);

  async function verify() {
    setBusy(true);
    try {
      await adminRequest(`/admin/payments/${paymentId}/verify`, { method: "POST", body: {} });
      toast("Payment verified");
      setMode("");
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await adminRequest(`/admin/payments/${paymentId}/reject`, { method: "POST", body: { reason, detail } });
      toast("Payment rejected");
      setMode("");
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!payment && !error) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} />;

  const canWrite = can("payments_write") && payment.status === "verification_pending";

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Payments", to: "/admin/payments" }, { label: payment.paymentId }]} />
      <AdminPageHeader title={payment.paymentId} actions={<StatusBadge status={payment.status} />} />
      <section className="max-w-2xl rounded-2xl border border-border bg-card p-4">
        <Row label="Booking ID" value={<Link className="text-pink" to={`/admin/bookings/${payment.bookingId}`}>{payment.bookingId}</Link>} />
        <Row label="Customer" value={payment.customer?.name} />
        <Row label="Email" value={payment.customer?.email} />
        <Row label="Mobile" value={payment.customer?.mobile} />
        <Row label="Amount" value={formatInr(payment.amount)} />
        <Row label="Currency" value={payment.currency} />
        <Row label="Method" value={payment.method} />
        <Row label="UPI" value={payment.upiId} />
        <Row label="UTR" value={payment.utr} />
        <Row label="Payer Name" value={payment.payerName} />
        <Row label="Transaction Date" value={formatWhen(payment.transactionDate, true)} />
        <Row label="Submitted At" value={formatWhen(payment.submittedAt, true)} />
        <Row label="Current Status" value={payment.status} />
        {payment.rejectionReason ? <Row label="Rejection" value={payment.rejectionReason} /> : null}
      </section>
      {canWrite ? (
        <div className="mt-5 flex gap-3">
          <button type="button" className="rounded-xl bg-gradient-to-r from-orange to-pink px-4 py-2 text-sm font-semibold" onClick={() => setMode("verify")}>
            Verify Payment
          </button>
          <button type="button" className="rounded-xl border border-danger px-4 py-2 text-sm text-danger" onClick={() => setMode("reject")}>
            Reject Payment
          </button>
        </div>
      ) : null}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-text-secondary">Activity</h2>
        {payment.activity?.length ? (
          <ol className="space-y-3">
            {payment.activity.map((item) => (
              <li key={`${item.action}-${item.at}`} className="text-sm">
                <p className="text-text-muted">{formatWhen(item.at, true)}</p>
                <p>{actionLabel(item.action)} · {item.actor}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-text-muted">No activity recorded yet.</p>
        )}
      </section>
      <ConfirmDialog
        open={mode === "verify"}
        title="Verify this payment?"
        description="Confirm only after matching the transaction in the official business UPI/bank records."
        confirmLabel="Confirm Payment"
        busyLabel="Verifying..."
        busy={busy}
        onClose={() => setMode("")}
        onConfirm={verify}
      >
        <p className="text-sm text-text-secondary">Amount: {formatInr(payment.amount)}</p>
        <p className="text-sm text-text-secondary">UTR: {payment.utr || "—"}</p>
        <p className="text-sm text-text-secondary">Booking: {payment.bookingId}</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={mode === "reject"}
        title="Reject Payment"
        confirmLabel="Reject Payment"
        busyLabel="Rejecting..."
        danger
        busy={busy}
        onClose={() => setMode("")}
        onConfirm={reject}
      >
        <label className="block text-sm text-text-secondary">
          Reason
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-white">
            {REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {reason === "Other" ? (
          <label className="mt-3 block text-sm text-text-secondary">
            Details
            <input value={detail} onChange={(event) => setDetail(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-white" />
          </label>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
