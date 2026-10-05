import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import PaymentAmountCard from "../components/payment/PaymentAmountCard";
import PaymentEventCard from "../components/payment/PaymentEventCard";
import PaymentSecurityNote from "../components/payment/PaymentSecurityNote";
import PaymentTimer, { usePaymentTimer } from "../components/payment/PaymentTimer";
import UPIInstructionCard from "../components/payment/UPIInstructionCard";
import UTRForm from "../components/payment/UTRForm";
import Button from "../components/ui/Button";
import { BOOKING_REF_KEY } from "../constants/booking";
import { useBooking } from "../context/BookingContext";
import { usePayment } from "../context/PaymentContext";
import usePageMeta from "../utils/usePageMeta";

function referenceFrom(booking) {
  return booking.completed?.bookingId || booking.bookingId || localStorage.getItem(BOOKING_REF_KEY) || "";
}

export default function Payment() {
  const navigate = useNavigate();
  const booking = useBooking();
  const paymentState = usePayment();
  const reduce = useReducedMotion();
  const reference = booking.ready ? referenceFrom(booking) : "";
  const startedFor = useRef("");
  const timer = usePaymentTimer(paymentState.expiresAt);
  const payment = paymentState.payment;

  usePageMeta({
    title: "Complete Your Payment — MOMNT",
    description: "Pay the official MOMNT UPI ID and submit your UTR for verification.",
  });

  useEffect(() => {
    if (!reference || startedFor.current === reference) return;
    startedFor.current = reference;
    paymentState.initializePayment(reference);
  }, [reference, paymentState]);

  if (!booking.ready) return null;
  if (!reference) return <Navigate to="/experiences" replace />;

  if (payment?.status === "verification_pending") {
    return <Navigate to="/my-bookings" replace />;
  }

  if (payment?.status === "paid" || payment?.status === "failed") {
    return <Navigate to={`/payment/status/${payment.bookingId}`} replace />;
  }

  const expired = timer.expired || paymentState.error?.code === "PAYMENT_EXPIRED" || paymentState.error?.code === "BOOKING_EXPIRED";
  const blocked = Boolean(paymentState.error) && !payment;

  function openUpiApp() {
    if (!payment?.upiIntentUrl || expired) return;
    window.location.href = payment.upiIntentUrl;
  }

  async function handleSubmit(details) {
    try {
      await paymentState.submitUTR(payment.paymentId, details);
      navigate("/my-bookings");
    } catch {
      return;
    }
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        Complete Your Payment
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-secondary">
        Secure your MOMNT by completing the payment below.
      </p>

      {paymentState.loading && !payment ? (
        <div className="mt-8 h-64 animate-pulse rounded-[16px] border border-border bg-card" />
      ) : null}

      {blocked ? (
        <div className="mt-8 max-w-xl rounded-[16px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-white">
            {expired ? "Payment Session Expired" : paymentState.error?.code === "BOOKING_NOT_FOUND" ? "Booking not found." : "Something went wrong."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {paymentState.error?.message || "Something went wrong. Please try again."}
          </p>
          <Button to="/experiences/premium-sunday-experience" className="mt-6">
            Return to Booking
          </Button>
        </div>
      ) : null}

      {payment && payment.status !== "verification_pending" && payment.status !== "paid" ? (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="order-1 flex flex-col gap-6 lg:order-2">
            <PaymentEventCard event={payment.event} />
            <PaymentAmountCard amount={payment.amount} quantity={booking.completed?.quantity} />
          </div>
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <PaymentTimer label={timer.label} expired={expired} />
            {expired ? (
              <div className="rounded-[16px] border border-border bg-card p-5">
                <h2 className="text-xl font-semibold text-white">Payment session expired.</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  This payment session has expired. Please create a new payment session.
                </p>
                <Button to="/experiences/premium-sunday-experience" className="mt-6" fullWidth>
                  Return to Event
                </Button>
              </div>
            ) : (
              <UPIInstructionCard payment={payment} expired={expired} onOpenApp={openUpiApp} />
            )}
            <PaymentSecurityNote />
            <UTRForm
              disabled={expired}
              loading={paymentState.loading}
              onSubmit={handleSubmit}
            />
            {paymentState.error && payment ? (
              <p role="alert" className="text-sm text-danger">
                {paymentState.error.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
