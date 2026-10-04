import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BookingStep } from "../components/booking/BookingLayout";
import GuestDetailsForm, { useGuestReady } from "../components/booking/GuestDetailsForm";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import usePageMeta from "../utils/usePageMeta";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { ready, event, quantity, customer, sessionExpired, setStatus } = useBooking();
  const readyToContinue = useGuestReady();

  usePageMeta({
    title: "Guest Details — MOMNT",
    description: "Tell us who's coming so MOMNT can confirm your experience.",
  });

  if (!ready) return null;
  if (sessionExpired || !event) return <Navigate to="/booking" replace />;

  return (
    <BookingStep
      actions={
        <Button
          type="submit"
          form="guest-details-form"
          size="lg"
          arrow
          fullWidth
          disabled={!readyToContinue}
        >
          Continue to Review
        </Button>
      }
    >
      <Link
        to="/booking"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Passes
      </Link>
      <h1 className="mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        Tell Us Who&apos;s Coming
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-secondary">
        We&apos;ll use these details to confirm your MOMNT.
      </p>
      <p className="mt-6 text-sm text-text-secondary">
        Number of passes: <span className="font-semibold text-white">{quantity}</span>
      </p>
      {customer.name.trim().length >= 2 ? (
        <p className="mt-2 text-sm text-text-secondary">
          Primary Booker: <span className="font-semibold text-white">{customer.name.trim()}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-text-muted">Additional guest details are optional.</p>
      <div className="mt-8">
        <GuestDetailsForm
          onContinue={() => {
            setStatus("review");
            navigate("/booking/review");
          }}
        />
      </div>
    </BookingStep>
  );
}
