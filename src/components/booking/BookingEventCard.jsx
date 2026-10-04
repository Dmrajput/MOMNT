import { CalendarDays, Clock3, MapPin } from "lucide-react";
import MediaImage from "../ui/MediaImage";
import { formatPrice } from "../../utils/helpers";

function Meta({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text-secondary">
      <Icon className="size-4 shrink-0 text-text-muted" aria-hidden="true" strokeWidth={1.75} />
      <span>{children}</span>
    </li>
  );
}

export default function BookingEventCard({ event }) {
  if (!event) return null;

  return (
    <article className="overflow-hidden rounded-[16px] border border-white/[0.08] bg-card">
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
        <h2 className="mt-2 text-lg font-semibold text-white">{event.title}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          <Meta icon={CalendarDays}>{event.date}</Meta>
          <Meta icon={Clock3}>{event.time}</Meta>
          <Meta icon={MapPin}>{event.location}</Meta>
        </ul>
        <p className="mt-4 text-base font-semibold text-white">
          {formatPrice(event.price)}
          <span className="ml-2 text-sm font-medium text-text-secondary">/ person</span>
        </p>
      </div>
    </article>
  );
}
