export function eventEndInstant(snapshot) {
  if (!snapshot?.date || !snapshot?.endTime) return null;
  const match = String(snapshot.endTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(snapshot.date));
  return new Date(`${day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

export function hasEventEnded(snapshot, now = new Date()) {
  const end = eventEndInstant(snapshot);
  if (!end || Number.isNaN(end.getTime())) return false;
  return now.getTime() > end.getTime();
}
