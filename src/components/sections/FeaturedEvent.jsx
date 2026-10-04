import Container from "../layout/Container";
import SectionHeading from "../ui/SectionHeading";
import EventCard from "../ui/EventCard";
import { getFeaturedEvent } from "../../data/events";

export default function FeaturedEvent() {
  const event = getFeaturedEvent();
  if (!event) return null;

  return (
    <section aria-labelledby="upcoming-heading" className="pb-[70px] lg:pb-[100px]">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading id="upcoming-heading" title="Upcoming MOMNT" />
          <p className="max-w-xs text-base leading-relaxed text-text-secondary lg:pb-2 lg:text-right">
            Your next unforgettable experience is waiting.
          </p>
        </div>
        <div className="mt-10">
          <EventCard event={event} layout="split" />
        </div>
      </Container>
    </section>
  );
}
