import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BookingStep } from "../components/booking/BookingLayout";
import ReviewDetails from "../components/booking/BookingReview";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import { validateBooking } from "../utils/validation";
import usePageMeta from "../utils/usePageMeta";

export default function BookingReview() {
  const navigate = useNavigate();
  const booking = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Review Your MOMNT — MOMNT",
    description: "Review your MOMNT passes before the booking is created.",
  });

  if (!booking.ready) return null;
  if (booking.sessionExpired || !booking.event) return <Navigate to="/booking" replace />;
  if (!validateBooking(booking.customer, booking.termsAccepted).valid) {
    return <Navigate to="/booking/details" replace />;
  }

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const record = await booking.createLocalBooking();
      if (!record) {
        setError("Experience not found.");
        return;
      }
      navigate("/booking/success");
    } catch (requestError) {
      setError(requestError?.message || "Your booking could not be created. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BookingStep
      actions={
        <div>
          <Button
            size="lg"
            arrow
            fullWidth
            loading={loading}
            disabled={loading}
            onClick={handleCreate}
          >
            {loading ? "Creating booking..." : "Create Booking"}
          </Button>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      }
    >
      <Link
        to="/booking/details"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Details
      </Link>
      <h1 className="mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        Review Your MOMNT
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-secondary">
        Confirm the experience, your passes, and who the booking is for.
      </p>
      <div className="mt-8">
        <ReviewDetails />
      </div>
    </BookingStep>
  );
}
