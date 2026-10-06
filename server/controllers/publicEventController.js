import { getPublicEventBySlug, listPublicEvents } from "../services/publicEventService.js";

export async function listEvents(req, res) {
  const events = await listPublicEvents();
  res.json({ success: true, events });
}

export async function showEvent(req, res) {
  const event = await getPublicEventBySlug(req.validated.params.slug);
  res.json({ success: true, event });
}
