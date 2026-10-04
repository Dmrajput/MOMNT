import { CalendarDays, MapPin } from "lucide-react";
import MediaImage from "../ui/MediaImage";
import { useBooking } from "../../context/BookingContext";
import { formatPrice } from "../../utils/helpers";

export default function OrderSummary() {
  const { event, quantity, subtotal, bookingFee, total } = useBooking();

  if (!event) {
    return (
      <aside className="rounded-[16px] border border-white/[0.08] bg-card p-5">
        <p className="text-sm text-text-secondary">Your summary will appear here.</p>
      </aside>
    );
  }

  return (
    <aside className="overflow-hidden rounded-[16px] border border-white/[0.08] bg-card">
      <div className="aspect-video">
        <MediaImage
          src={event.image}
          alt={`${event.title} in ${event.location}`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-5">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
          {event.number}
        </p>
        <h2 className="mt-2 text-lg leading-snug font-semibold text-white">{event.title}</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 text-text-muted" aria-hidden="true" />
            {event.date}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-text-muted" aria-hidden="true" />
            {event.location}
          </li>
        </ul>
        <dl className="mt-6 border-t border-border pt-4 text-sm">
          <div className="flex items-start justify-between gap-4 py-2">
            <dt className="text-text-secondary">
              Experience Pass
              <span className="mt-1 block text-text-muted">
                {formatPrice(event.price)} × {quantity}
              </span>
            </dt>
            <dd className="font-medium text-white">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-text-secondary">Booking Fee</dt>
            <dd className="font-medium text-white">{formatPrice(bookingFee)}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-4">
            <dt className="text-base font-semibold text-white">Total</dt>
            <dd className="text-2xl font-bold text-white">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[12px] font-semibold tracking-[0.14em] text-pink uppercase">
          {event.badge || `Limited ${event.capacity} Passes`}
        </p>
        <p className="mt-1 text-sm text-text-muted">Limited availability</p>
      </div>
    </aside>
  );
}
