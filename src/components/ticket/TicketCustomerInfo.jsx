function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.16em] text-text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-lg font-semibold break-all text-white">{value}</dd>
    </div>
  );
}

export default function TicketCustomerInfo({ ticket }) {
  return (
    <dl className="grid grid-cols-2 gap-5">
      <Fact label="Access for" value={ticket.customer.name} />
      <Fact label="Passes" value={String(ticket.quantity)} />
      <div className="col-span-2">
        <Fact label="Ticket" value={ticket.ticketId} />
      </div>
    </dl>
  );
}
