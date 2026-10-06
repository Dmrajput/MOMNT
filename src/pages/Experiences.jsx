import { useState } from "react";
import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import EventCard from "../components/ui/EventCard";
import { experienceFilters } from "../data/events";
import { useEventCatalog } from "../context/EventCatalogContext";
import { classNames, eventMatchesFilter } from "../utils/helpers";
import usePageMeta from "../utils/usePageMeta";

export default function Experiences() {
  const [filter, setFilter] = useState("All");
  const { events, settled } = useEventCatalog();
  const visible = events.filter((event) => eventMatchesFilter(event, filter));

  usePageMeta({
    title: "MOMNT — Upcoming Experiences",
    description: "Curated experiences for amazing people.",
    image: "/images/event-01.jpg",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <SectionHeading
          as="h1"
          title="Upcoming Experiences"
          description="Curated experiences for amazing people."
        />

        <div
          className="mt-10 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter experiences"
        >
          {experienceFilters.map((item) => {
            const selected = filter === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item)}
                className={classNames(
                  "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors",
                  selected
                    ? "border-pink/40 bg-white/5 text-white"
                    : "border-border text-text-secondary hover:text-white",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        {!settled && !events.length ? (
          <p className="mt-10 text-text-secondary">Loading experiences...</p>
        ) : null}
        {settled && !events.length ? (
          <p className="mt-10 max-w-md text-text-secondary" role="status">
            Event coming soon. No experience is live right now.
          </p>
        ) : visible.length ? (
          <ul
            className={classNames(
              "mt-10 grid gap-6",
              visible.length > 1 && "sm:grid-cols-2",
            )}
          >
            {visible.map((event, index) => (
              <li key={event.id} className="min-w-0">
                <EventCard event={event} index={index} headingLevel={2} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 max-w-md text-text-secondary" role="status">
            Nothing in this category yet. MOMNT #01 is a Sunday day experience
            in Ahmedabad.
          </p>
        )}
      </Container>
    </PageTransition>
  );
}
