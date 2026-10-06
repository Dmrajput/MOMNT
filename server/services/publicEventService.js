import Event from "../models/Event.js";
import { AppError } from "../utils/errors.js";
import { formatEventDate } from "../utils/validators.js";

const PUBLIC_STATUSES = ["published", "sold_out"];

export function presentPublicEvent(event) {
  const remaining = Math.max(0, event.capacity - event.bookedQuantity);
  return {
    id: event.eventId,
    slug: event.slug,
    number: event.number,
    title: event.title,
    location: event.location,
    date: formatEventDate(event.date),
    startTime: event.startTime,
    endTime: event.endTime,
    time: `${event.startTime} – ${event.endTime}`,
    price: event.price,
    capacity: event.capacity,
    remaining,
    status: event.status,
    bookable: event.status === "published" && remaining > 0,
    image: event.image || "",
    description: event.description || "",
    inclusions: event.inclusions || [],
  };
}

export async function listPublicEvents() {
  const events = await Event.find({ status: { $in: PUBLIC_STATUSES } }).sort({ date: 1, createdAt: 1 });
  return events.map(presentPublicEvent);
}

export async function getPublicEventBySlug(slug) {
  const event = await Event.findOne({ slug, status: { $in: PUBLIC_STATUSES } });
  if (!event) throw new AppError("NOT_FOUND", "Experience not found.", 404);
  return presentPublicEvent(event);
}
