import Container from "../layout/Container";
import SectionHeading from "../ui/SectionHeading";
import EventCard from "../ui/EventCard";
import { useEventCatalog } from "../../context/EventCatalogContext";

export default function FeaturedEvent() {
  const { featured: event, settled } = useEventCatalog();
  if (!event && !settled) return null;

  return (
    <section aria-labelledby="upcoming-heading" className="pb-[70px] lg:pb-[100px]">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading id="upcoming-heading" title="Upcoming MOMNT" />
          <p className="max-w-xs text-base leading-relaxed text-text-secondary lg:pb-2 lg:text-right">
            {event ? "Your next unforgettable experience is waiting." : "A new experience will be announced here."}
          </p>
        </div>
        <div className="mt-10">
          {event ? (
            <EventCard event={event} layout="split" />
          ) : (
            <div className="rounded-[20px] border border-white/[0.08] bg-card px-6 py-16 text-center shadow-[0_12px_40px_rgba(0,0,0,0.28)]" role="status">
              <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">Event coming soon</p>
              <p className="mx-auto mt-3 max-w-md text-text-secondary">
                No experience is live right now.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
