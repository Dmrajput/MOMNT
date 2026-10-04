import { accessFor } from "../utils/permissions.js";
import {
  cancelAdminEvent,
  createAdminEvent,
  duplicateAdminEvent,
  getAdminEvent,
  listAdminEvents,
  updateAdminEvent,
} from "../services/adminEventService.js";

export async function showEvents(req, res) {
  const data = await listAdminEvents();
  const access = accessFor(req.admin.role);
  const financial = access.includes("events") || access.includes("payments") || access.includes("reports");
  res.json({
    success: true,
    data: financial ? data : data.map(({ revenue, price, ...event }) => event),
  });
}

export async function postEvent(req, res) {
  const event = await createAdminEvent(req.validated.body, req.admin, req);
  res.status(201).json({ success: true, event });
}

export async function showEvent(req, res) {
  res.json({ success: true, event: await getAdminEvent(req.validated.params.eventId) });
}

export async function patchEvent(req, res) {
  const event = await updateAdminEvent(req.validated.params.eventId, req.validated.body, req.admin, req);
  res.json({ success: true, event });
}

export async function postCancelEvent(req, res) {
  res.json({ success: true, event: await cancelAdminEvent(req.validated.params.eventId, req.admin, req) });
}

export async function postDuplicateEvent(req, res) {
  const event = await duplicateAdminEvent(req.validated.params.eventId, req.admin, req);
  res.status(201).json({ success: true, event });
}
