import staticEvents from "../data/events";

const editorialBySlug = new Map(staticEvents.map((event) => [event.slug, event]));
const editorialById = new Map(staticEvents.map((event) => [event.id, event]));

function simpleSchedule(startTime, endTime) {
  if (!startTime || !endTime) return [];
  return [
    { time: startTime, label: "Doors open", detail: "Arrival." },
    { time: endTime, label: "Close", detail: "The experience ends." },
  ];
}

export function presentCatalogEvent(event) {
  const extra = editorialBySlug.get(event.slug) || editorialById.get(event.id) || null;
  const description = event.description || extra?.description || "";
  const descriptionChanged = Boolean(extra && description && description !== extra.description);
  const timeChanged = Boolean(extra?.time && event.time && event.time !== extra.time);
  const tags = [event.location, ...(extra?.tags || []).filter((tag) => tag !== extra?.location)].filter(Boolean);

  return {
    id: event.id,
    slug: event.slug,
    number: event.number,
    title: event.title,
    location: event.location,
    date: event.date,
    time: event.time,
    price: event.price,
    capacity: event.capacity,
    remaining: event.remaining,
    image: event.image || extra?.image || "/images/event-01.jpg",
    description,
    inclusions: Array.isArray(event.inclusions) ? event.inclusions : extra?.inclusions || [],
    tags: [...new Set(tags)],
    badge: event.bookable ? `Limited ${event.capacity} Passes` : "Sold Out",
    status: event.bookable ? "Upcoming" : "Sold Out",
    bookable: Boolean(event.bookable),
    about: descriptionChanged || !extra?.about?.length ? [description].filter(Boolean) : extra.about,
    schedule: !timeChanged && extra?.schedule?.length ? extra.schedule : simpleSchedule(event.startTime, event.endTime),
  };
}

export function fallbackCatalog() {
  return staticEvents.map((event) =>
    presentCatalogEvent({
      id: event.id,
      slug: event.slug,
      number: event.number,
      title: event.title,
      location: event.location,
      date: event.date,
      startTime: event.time.split("–")[0]?.trim(),
      endTime: event.time.split("–")[1]?.trim(),
      time: event.time,
      price: event.price,
      capacity: event.capacity,
      remaining: event.capacity,
      status: "published",
      bookable: true,
      image: event.image,
      description: event.description,
      inclusions: event.inclusions,
    }),
  );
}
