import { useState } from "react";
import Button from "../ui/Button";

const fieldClass =
  "h-14 w-full rounded-[12px] border border-[#292532] bg-card px-4 text-base text-white placeholder:text-text-muted focus:border-pink focus:shadow-[0_0_0_3px_rgba(255,45,141,0.16)] focus:outline-none";

function normalizeUtr(value) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function utrError(value) {
  const utr = normalizeUtr(value);
  if (!/^[A-Z0-9]{8,22}$/.test(utr) || /^(.)\1+$/.test(utr)) {
    return "Enter the UTR shown in your UPI transaction history.";
  }
  return "";
}

export default function UTRForm({ disabled, loading, onSubmit }) {
  const [utr, setUtr] = useState("");
  const [payerName, setPayerName] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function validate(next = { utr, payerName }) {
    return {
      utr: utrError(next.utr),
      payerName: next.payerName.trim().length < 2 ? "Please enter the payer name." : "",
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setTouched({ utr: true, payerName: true });
    setErrors(nextErrors);
    if (nextErrors.utr || nextErrors.payerName || disabled || loading) return;
    onSubmit({
      utr: normalizeUtr(utr),
      payerName: payerName.trim(),
      transactionDate: transactionDate || undefined,
    });
  }

  const showUtr = touched.utr && errors.utr;
  const showName = touched.payerName && errors.payerName;

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[16px] border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">I Have Paid</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Enter the UTR shown in your UPI transaction history. Submitting this reference does not confirm the payment.
      </p>
      <p className="mt-3 text-sm text-text-muted">
        Payment screenshot is optional and may be requested during verification.
      </p>

      <div className="mt-6">
        <label htmlFor="utr" className="mb-2 block text-sm font-medium text-white">
          UTR / Transaction Reference *
        </label>
        <input
          id="utr"
          name="utr"
          value={utr}
          autoComplete="off"
          aria-invalid={showUtr || undefined}
          aria-describedby={showUtr ? "utr-error" : "utr-help"}
          placeholder="123456789012"
          disabled={disabled || loading}
          onBlur={() => {
            setTouched((current) => ({ ...current, utr: true }));
            setErrors(validate());
          }}
          onChange={(event) => setUtr(event.target.value)}
          className={fieldClass}
        />
        <p id="utr-help" className="mt-2 text-sm text-text-muted">
          Enter the UTR shown in your UPI transaction history.
        </p>
        {showUtr ? (
          <p id="utr-error" role="alert" className="mt-2 text-sm text-danger">
            {errors.utr}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="payer-name" className="mb-2 block text-sm font-medium text-white">
          Payer Name *
        </label>
        <input
          id="payer-name"
          name="payerName"
          value={payerName}
          autoComplete="name"
          aria-invalid={showName || undefined}
          aria-describedby={showName ? "payer-name-error" : undefined}
          placeholder="Name on the UPI account"
          disabled={disabled || loading}
          onBlur={() => {
            setTouched((current) => ({ ...current, payerName: true }));
            setErrors(validate());
          }}
          onChange={(event) => setPayerName(event.target.value)}
          className={fieldClass}
        />
        {showName ? (
          <p id="payer-name-error" role="alert" className="mt-2 text-sm text-danger">
            {errors.payerName}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="transaction-date" className="mb-2 block text-sm font-medium text-white">
          Transaction Date
        </label>
        <input
          id="transaction-date"
          name="transactionDate"
          type="date"
          value={transactionDate}
          disabled={disabled || loading}
          onChange={(event) => setTransactionDate(event.target.value)}
          className={fieldClass}
        />
      </div>

      <Button type="submit" size="lg" arrow fullWidth className="mt-6" loading={loading} disabled={disabled || loading}>
        {loading ? "Submitting..." : "I've Paid — Submit UTR"}
      </Button>
    </form>
  );
}
