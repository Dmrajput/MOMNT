import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useBooking } from "../../context/BookingContext";
import { classNames } from "../../utils/helpers";
import { validateBooking, validateEmail, validateMobile, validateName } from "../../utils/validation";

const fieldClass =
  "h-14 w-full rounded-[12px] border border-[#292532] bg-card px-4 text-base text-white placeholder:text-text-muted focus:border-pink focus:shadow-[0_0_0_3px_rgba(255,45,141,0.16)] focus:outline-none";

function Field({ id, label, error, showError, children }) {
  const reduce = useReducedMotion();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      {children(error && showError ? errorId : undefined)}
      {error && showError ? (
        <motion.p
          id={errorId}
          role="alert"
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 text-sm text-danger"
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  );
}

export default function GuestDetailsForm({ onContinue, id = "guest-details-form" }) {
  const { user } = useAuth();
  const { customer, guestNames, termsAccepted, setCustomer, setAttendees, setTermsAccepted } =
    useBooking();
  const locked = Boolean(user);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: validateName(customer.name),
    mobile: validateMobile(customer.mobile),
    email: validateEmail(customer.email),
    terms: termsAccepted ? "" : "Please agree to the terms to continue.",
  };
  const ready = validateBooking(customer, termsAccepted).valid;

  function show(field) {
    return Boolean((touched[field] || submitted) && errors[field]);
  }

  function touch(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!ready) return;
    const names = guestNames
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    setAttendees(names, guestNames);
    onContinue();
  }

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field id="full-name" label="Full Name *" error={errors.name} showError={show("name")}>
        {(errorId) => (
          <input
            id="full-name"
            name="name"
            type="text"
            autoComplete="name"
            value={customer.name}
            aria-invalid={show("name") || undefined}
            aria-describedby={errorId}
            placeholder="Your name"
            readOnly={locked}
            onBlur={() => touch("name")}
            onChange={(event) => setCustomer({ name: event.target.value })}
            className={classNames(fieldClass, show("name") && "border-danger")}
          />
        )}
      </Field>

      <Field
        id="mobile"
        label="Mobile Number *"
        error={errors.mobile}
        showError={show("mobile")}
      >
        {(errorId) => (
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={customer.mobile}
            aria-invalid={show("mobile") || undefined}
            aria-describedby={errorId}
            placeholder="9876543210"
            readOnly={locked}
            onBlur={() => touch("mobile")}
            onChange={(event) => setCustomer({ mobile: event.target.value })}
            className={classNames(fieldClass, show("mobile") && "border-danger")}
          />
        )}
      </Field>

      <Field id="email" label="Email Address *" error={errors.email} showError={show("email")}>
        {(errorId) => (
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={customer.email}
            aria-invalid={show("email") || undefined}
            aria-describedby={errorId}
            placeholder="you@email.com"
            readOnly={locked}
            onBlur={() => touch("email")}
            onChange={(event) => setCustomer({ email: event.target.value })}
            className={classNames(fieldClass, show("email") && "border-danger")}
          />
        )}
      </Field>

      <Field id="guest-names" label="Guest Names" error="" showError={false}>
        {() => (
          <input
            id="guest-names"
            name="guestNames"
            type="text"
            value={guestNames}
            placeholder="Enter guest names separated by commas"
            onChange={(event) => setAttendees(
              event.target.value
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean),
              event.target.value,
            )}
            className={fieldClass}
          />
        )}
      </Field>
      <p className="-mt-4 text-sm text-text-muted">Optional. Not required to reserve.</p>

      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-pink"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="text-white underline underline-offset-4">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link to="/refund" className="text-white underline underline-offset-4">
              Refund Policy
            </Link>
            .
          </span>
        </label>
      </div>

    </form>
  );
}

export function useGuestReady() {
  const { customer, termsAccepted } = useBooking();
  return validateBooking(customer, termsAccepted).valid;
}
