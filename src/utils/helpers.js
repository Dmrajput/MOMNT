export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function eventPath(event) {
  return `/experiences/${event.slug}`;
}

export function eventMatchesFilter(event, filter) {
  if (!filter || filter === "All") return true;
  return event.tags.includes(filter) || event.location === filter;
}
