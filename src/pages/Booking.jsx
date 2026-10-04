import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BookingStep } from "../components/booking/BookingLayout";
import BookingEventCard from "../components/booking/BookingEventCard";
import PassSelector from "../components/booking/PassSelector";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import { MIN_PASSES } from "../constants/booking";
import { passLimit } from "../utils/booking";
import { eventPath } from "../utils/helpers";
import usePageMeta from "../utils/usePageMeta";

export default function Booking() {
  const navigate = useNavigate();
  const {
    ready,
    event,
    quantity,
    setQuantity,
    setStatus,
    sessionExpired,
    dismissExpired,
    clearBooking,
  } = useBooking();

  usePageMeta({
    title: "Reserve Your MOMNT — MOMNT",
    description: "Choose how many experience passes you'd like for MOMNT.",
  });

  if (!ready) return null;

  if (sessionExpired) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white">
          Your booking session has expired.
        </h1>
        <p className="mt-4 text-text-secondary">
          Drafts are kept for 30 minutes. Start again to reserve your MOMNT.
        </p>
        <Button
          className="mt-8"
          onClick={() => {
            clearBooking();
            dismissExpired();
            navigate("/experiences");
          }}
        >
          Start Again
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white">
          No active booking
        </h1>
        <p className="mt-4 text-text-secondary">
          Choose an experience to reserve your MOMNT.
        </p>
        <Button to="/experiences" arrow className="mt-8">
          Explore Experiences
        </Button>
      </div>
    );
  }

  const max = passLimit(event);

  return (
    <BookingStep
      actions={
        <Button
          size="lg"
          arrow
          fullWidth
          disabled={quantity < MIN_PASSES || quantity > max}
          onClick={() => {
            setStatus("details");
            navigate("/booking/details");
          }}
        >
          Continue to Guest Details
        </Button>
      }
    >
      <Link
        to={eventPath(event)}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Experience
      </Link>
      <h1 className="mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
        Reserve Your MOMNT
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-secondary">
        Choose how many experience passes you&apos;d like.
      </p>
      <div className="mt-8 lg:hidden">
        <BookingEventCard event={event} />
      </div>
      <div className="mt-8">
        <PassSelector
          quantity={quantity}
          min={MIN_PASSES}
          max={max}
          price={event.price}
          onChange={setQuantity}
        />
      </div>
    </BookingStep>
  );
}
