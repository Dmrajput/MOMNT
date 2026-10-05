import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Payment from "../models/Payment.js";
import Ticket from "../models/Ticket.js";

export async function checkDataIntegrity() {
  const issues = [];
  const [payments, bookings, tickets, events] = await Promise.all([
    Payment.find().select("paymentReference bookingId status"),
    Booking.find().select("bookingId bookingStatus paymentStatus"),
    Ticket.find().select("ticketId bookingId status"),
    Event.find().select("eventId capacity bookedQuantity"),
  ]);
  const bookingsById = new Map(bookings.map((booking) => [String(booking._id), booking]));
  const ticketsByBooking = new Map(tickets.map((ticket) => [String(ticket.bookingId), ticket]));

  for (const payment of payments) {
    if (payment.status !== "paid") continue;
    const booking = bookingsById.get(String(payment.bookingId));
    if (!booking || booking.bookingStatus !== "confirmed") {
      issues.push({ code: "PAID_BOOKING_NOT_CONFIRMED", paymentId: payment.paymentReference });
    }
    if (!ticketsByBooking.get(String(payment.bookingId))) {
      issues.push({ code: "PAID_TICKET_MISSING", paymentId: payment.paymentReference });
    }
  }

  for (const booking of bookings) {
    if (booking.bookingStatus !== "confirmed") continue;
    if (booking.paymentStatus !== "paid") {
      issues.push({ code: "CONFIRMED_NOT_PAID", bookingId: booking.bookingId });
    }
    if (!ticketsByBooking.get(String(booking._id))) {
      issues.push({ code: "CONFIRMED_TICKET_MISSING", bookingId: booking.bookingId });
    }
  }

  for (const ticket of tickets) {
    const booking = bookingsById.get(String(ticket.bookingId));
    if (!booking || booking.bookingStatus !== "confirmed") {
      issues.push({ code: "TICKET_WITHOUT_CONFIRMED_BOOKING", ticketId: ticket.ticketId });
    }
  }

  for (const event of events) {
    if (event.bookedQuantity > event.capacity) {
      issues.push({ code: "CAPACITY_EXCEEDED", eventId: event.eventId });
    }
  }

  return { ok: issues.length === 0, issues };
}
