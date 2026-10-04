import crypto from "node:crypto";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import { AppError } from "../utils/errors.js";
import { recordAdminAudit } from "../utils/adminQuery.js";

const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function assertTime(value, label) {
  if (!TIME_PATTERN.test(String(value || "").trim())) {
    throw new AppError("VALIDATION_ERROR", `Enter a valid ${label}.`, 400);
  }
}

export function presentAdminEvent(event) {
  return {
    eventId: event.eventId,
    slug: event.slug,
    number: event.number,
    title: event.title,
    location: event.location,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    price: event.price,
    capacity: event.capacity,
    bookedQuantity: event.bookedQuantity,
    remaining: Math.max(0, event.capacity - event.bookedQuantity),
    status: event.status,
    image: event.image,
    description: event.description,
    inclusions: event.inclusions,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function readEventInput(body, { partial = false } = {}) {
  const input = {};
  const assign = (key, value) => {
    if (value !== undefined) input[key] = value;
  };
  if (!partial || body.number !== undefined) assign("number", String(body.number || "").trim());
  if (!partial || body.title !== undefined) assign("title", String(body.title || "").trim());
  if (!partial || body.location !== undefined) assign("location", String(body.location || "").trim());
  if (!partial || body.slug !== undefined) assign("slug", slugify(body.slug || body.title));
  if (!partial || body.date !== undefined) assign("date", body.date ? new Date(body.date) : null);
  if (!partial || body.startTime !== undefined) assign("startTime", String(body.startTime || "").trim());
  if (!partial || body.endTime !== undefined) assign("endTime", String(body.endTime || "").trim());
  if (!partial || body.price !== undefined) assign("price", Number(body.price));
  if (!partial || body.capacity !== undefined) assign("capacity", Number(body.capacity));
  if (!partial || body.description !== undefined) assign("description", String(body.description || "").slice(0, 2000));
  if (!partial || body.image !== undefined) assign("image", String(body.image || "").slice(0, 300));
  if (!partial || body.status !== undefined) assign("status", body.status);
  if (!partial || body.inclusions !== undefined) {
    const inclusions = Array.isArray(body.inclusions)
      ? body.inclusions
      : String(body.inclusions || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
    assign("inclusions", inclusions.slice(0, 20).map((item) => String(item).slice(0, 80)));
  }
  return input;
}

function validateEventInput(input, { partial = false } = {}) {
  const required = ["number", "title", "location", "slug", "startTime", "endTime"];
  if (!partial) {
    for (const key of required) {
      if (!input[key]) throw new AppError("VALIDATION_ERROR", "Please complete the event details.", 400);
    }
  }
  if (input.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new AppError("VALIDATION_ERROR", "Use a simple event slug.", 400);
  }
  if (input.date !== undefined && Number.isNaN(input.date?.getTime?.())) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid event date.", 400);
  }
  if (input.startTime !== undefined) assertTime(input.startTime, "start time");
  if (input.endTime !== undefined) assertTime(input.endTime, "end time");
  if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid price.", 400);
  }
  if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid capacity.", 400);
  }
  if (
    input.status !== undefined &&
    !["draft", "published", "sold_out", "cancelled", "completed", "archived"].includes(input.status)
  ) {
    throw new AppError("VALIDATION_ERROR", "Choose a valid event status.", 400);
  }
}

async function findEvent(eventId) {
  const event = await Event.findOne({ eventId });
  if (!event) throw new AppError("NOT_FOUND", "Event not found.", 404);
  return event;
}

export async function listAdminEvents() {
  const events = await Event.find().sort({ date: 1 });
  const revenue = await Booking.aggregate([
    {
      $match: { paymentStatus: "paid", bookingStatus: "confirmed" },
    },
    { $group: { _id: "$eventId", revenue: { $sum: "$total" } } },
  ]);
  const totals = new Map(revenue.map((row) => [String(row._id), row.revenue]));
  return events.map((event) => ({
    ...presentAdminEvent(event),
    revenue: totals.get(String(event._id)) || 0,
  }));
}

export async function getAdminEvent(eventId) {
  const event = await findEvent(eventId);
  const [revenueRow] = await Booking.aggregate([
    { $match: { eventId: event._id, paymentStatus: "paid", bookingStatus: "confirmed" } },
    { $group: { _id: null, revenue: { $sum: "$total" } } },
  ]);
  return { ...presentAdminEvent(event), revenue: revenueRow?.revenue || 0 };
}

export async function createAdminEvent(body, admin, req) {
  const input = readEventInput(body);
  validateEventInput(input);
  const eventId = slugify(body.eventId || input.slug);
  if (!eventId) throw new AppError("VALIDATION_ERROR", "Enter an event id.", 400);
  try {
    const event = await Event.create({
      ...input,
      eventId,
      status: input.status || "draft",
      bookedQuantity: 0,
    });
    await recordAdminAudit({
      adminId: admin._id,
      action: "EVENT_CREATED",
      resourceType: "event",
      resourceId: event.eventId,
      newValue: { title: event.title, price: event.price, capacity: event.capacity, status: event.status },
      req,
    });
    return presentAdminEvent(event);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("CONFLICT", "An event with that id or slug already exists.", 409);
    }
    throw error;
  }
}

export async function updateAdminEvent(eventId, body, admin, req) {
  const event = await findEvent(eventId);
  const input = readEventInput(body, { partial: true });
  validateEventInput(input, { partial: true });
  if (input.capacity !== undefined && input.capacity < event.bookedQuantity) {
    throw new AppError("CONFLICT", "Capacity cannot be lower than the passes already booked.", 409);
  }
  const previous = { price: event.price, capacity: event.capacity, status: event.status, title: event.title };
  Object.assign(event, input);
  await event.save();
  await recordAdminAudit({
    adminId: admin._id,
    action: "EVENT_UPDATED",
    resourceType: "event",
    resourceId: event.eventId,
    previousValue: previous,
    newValue: { price: event.price, capacity: event.capacity, status: event.status, title: event.title },
    req,
  });
  return presentAdminEvent(event);
}

export async function cancelAdminEvent(eventId, admin, req) {
  const event = await findEvent(eventId);
  if (event.status === "cancelled") return presentAdminEvent(event);
  const previous = event.status;
  event.status = "cancelled";
  await event.save();
  await recordAdminAudit({
    adminId: admin._id,
    action: "EVENT_CANCELLED",
    resourceType: "event",
    resourceId: event.eventId,
    previousValue: { status: previous },
    newValue: { status: "cancelled" },
    req,
  });
  return presentAdminEvent(event);
}

export async function duplicateAdminEvent(eventId, admin, req) {
  const event = await findEvent(eventId);
  const suffix = crypto.randomBytes(2).toString("hex");
  const copy = await Event.create({
    eventId: `${event.eventId}-${suffix}`.slice(0, 80),
    slug: `${event.slug}-${suffix}`.slice(0, 80),
    number: `${event.number} copy`,
    title: event.title,
    location: event.location,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    price: event.price,
    capacity: event.capacity,
    bookedQuantity: 0,
    status: "draft",
    image: event.image,
    description: event.description,
    inclusions: event.inclusions,
  });
  await recordAdminAudit({
    adminId: admin._id,
    action: "EVENT_CREATED",
    resourceType: "event",
    resourceId: copy.eventId,
    newValue: { duplicatedFrom: event.eventId },
    req,
  });
  return presentAdminEvent(copy);
}
