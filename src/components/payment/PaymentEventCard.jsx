import { CalendarDays, Clock3, MapPin } from "lucide-react";

function Meta({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text-secondary">
      <Icon className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function PaymentEventCard({ event }) {
  if (!event) return null;
  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-card">
      {event.image ? (
        <img src={event.image} alt="" className="aspect-video w-full object-cover" />
      ) : null}
      <div className="p-5">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">{event.number}</p>
        <h2 className="mt-2 text-lg leading-snug font-semibold text-white">{event.title}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          <Meta icon={CalendarDays}>{event.date}</Meta>
          <Meta icon={Clock3}>{event.time}</Meta>
          <Meta icon={MapPin}>{event.location}</Meta>
        </ul>
      </div>
    </article>
  );
}
