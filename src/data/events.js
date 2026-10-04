const events = [
  {
    id: "momnt-01",
    number: "MOMNT #01",
    slug: "premium-sunday-experience",
    title: "The Premium Sunday Experience",
    location: "Ahmedabad",
    date: "25 Oct 2026",
    time: "11:00 AM – 4:00 PM",
    price: 3000,
    capacity: 50,
    badge: "Limited 50 Passes",
    image: "/images/event-01.jpg",
    tags: ["Ahmedabad", "Day Party"],
    status: "Upcoming",
    description:
      "A premium private experience curated around great music, delicious food and unforgettable moments.",
    about: [
      "MOMNT #01 is a private Sunday for a small room of people. The afternoon moves from a welcome drink to live music, a proper lunch, and photographs that belong to the day.",
      "It begins in Ahmedabad. Fifty passes. One room. Held for the people in it, not for a crowd.",
    ],
    inclusions: [
      "Welcome Drink",
      "Live DJ",
      "Premium Lunch",
      "Event Photography",
    ],
    schedule: [
      {
        time: "11:00 AM",
        label: "Doors open",
        detail: "Arrival and a signature welcome drink.",
      },
      {
        time: "12:00 PM",
        label: "Live DJ",
        detail: "Music stays with the room through the afternoon.",
      },
      {
        time: "1:30 PM",
        label: "Premium lunch",
        detail: "A curated buffet, served without rushing the day.",
      },
      {
        time: "3:00 PM",
        label: "Photographs",
        detail: "Candid frames while the room is still together.",
      },
      {
        time: "4:00 PM",
        label: "Close",
        detail: "The experience ends.",
      },
    ],
  },
];

export const experienceFilters = ["All", "Ahmedabad", "Day Party", "Night Party"];

export function getEventBySlug(slug) {
  return events.find((event) => event.slug === slug) ?? null;
}

export function getEventById(id) {
  return events.find((event) => event.id === id) ?? null;
}

export function getFeaturedEvent() {
  return events[0] ?? null;
}

export default events;
