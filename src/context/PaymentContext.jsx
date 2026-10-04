import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createPayment,
  getBookingPaymentStatus,
  paymentIdempotencyKey,
  submitUTR,
} from "../services/paymentService";

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializePayment = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const next = await createPayment(bookingId, paymentIdempotencyKey(bookingId));
      setPayment(next);
      return next;
    } catch (requestError) {
      setError(requestError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitPaymentUtr = useCallback(async (paymentId, details) => {
    setLoading(true);
    setError(null);
    try {
      const next = await submitUTR(paymentId, details);
      setPayment((current) => ({ ...current, ...next }));
      return next;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPaymentStatus = useCallback((bookingId) => getBookingPaymentStatus(bookingId), []);

  const resetPayment = useCallback(() => {
    setPayment(null);
    setError(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      payment,
      loading,
      error,
      status: payment?.status || null,
      expiresAt: payment?.expiresAt || null,
      initializePayment,
      submitUTR: submitPaymentUtr,
      refreshPaymentStatus,
      resetPayment,
    }),
    [payment, loading, error, initializePayment, submitPaymentUtr, refreshPaymentStatus, resetPayment],
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}
