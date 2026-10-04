import Badge from "../ui/Badge";

const COPY = {
  active: { label: "Active", tone: "pink" },
  checked_in: { label: "Checked In", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

export default function TicketStatusBadge({ status }) {
  const copy = COPY[status] || COPY.active;
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-text-muted uppercase">Status</p>
      <Badge tone={copy.tone} className="mt-2">
        {copy.label}
      </Badge>
    </div>
  );
}
