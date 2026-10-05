import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import Event from "./models/Event.js";

dotenv.config();

if (process.env.NODE_ENV === "production" && process.env.SEED_PRODUCTION !== "1") {
  console.error("Refusing to seed production without SEED_PRODUCTION=1. This script only upserts MOMNT #01 and does not create bookings.");
  process.exit(1);
}

const event = {
  eventId: "momnt-01",
  slug: "premium-sunday-experience",
  number: "MOMNT #01",
  title: "The Premium Sunday Experience",
  location: "Ahmedabad",
  date: new Date("2026-10-25T00:00:00+05:30"),
  startTime: "11:00 AM",
  endTime: "4:00 PM",
  price: 3000,
  capacity: 50,
  status: "published",
  image: "/images/event-01.jpg",
  description:
    "A premium private experience curated around great music, delicious food and unforgettable moments.",
  inclusions: ["Welcome Drink", "Live DJ", "Premium Lunch", "Event Photography"],
};

const connection = await connectDb();
await Event.updateOne({ eventId: event.eventId }, { $setOnInsert: { bookedQuantity: 0 }, $set: event }, { upsert: true });
console.info(JSON.stringify({ seeded: event.eventId }));
await connection.close();
