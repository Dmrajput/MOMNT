import Event from "../models/Event.js";
import { dashboardStats, recentActivity, seriesFor } from "../services/adminDashboardService.js";
import { AppError } from "../utils/errors.js";

async function selectedEvent(eventId) {
  if (!eventId || eventId === "all") return null;
  const event = await Event.findOne({ eventId: String(eventId) });
  if (!event) throw new AppError("NOT_FOUND", "Event not found.", 404);
  return event;
}

export async function showDashboard(req, res) {
  const event = await selectedEvent(req.validated?.query?.eventId || req.query.eventId);
  const [stats, activity, series, events] = await Promise.all([
    dashboardStats(event?._id || null),
    recentActivity(event?._id || null),
    seriesFor(event?._id || null),
    Event.find().sort({ date: 1 }).select("eventId number title date status"),
  ]);
  res.json({
    success: true,
    event: event ? { eventId: event.eventId, number: event.number, title: event.title } : null,
    events: events.map((item) => ({
      eventId: item.eventId,
      number: item.number,
      title: item.title,
      date: item.date,
      status: item.status,
    })),
    stats,
    activity,
    series,
  });
}
