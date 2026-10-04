export default function TicketEventInfo({ event }) {
  return (
    <div className="mt-5 space-y-1 text-sm text-white md:text-base">
      <p className="font-semibold tracking-[0.08em] uppercase">{event.date}</p>
      <p>{event.time}</p>
      <p className="text-text-secondary">{event.location}</p>
    </div>
  );
}
