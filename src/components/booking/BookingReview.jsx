import { Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { formatPrice } from "../../utils/helpers";
import { maskMobile } from "../../utils/booking";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export default function BookingReview() {
  const { event, quantity, customer, guestNames, subtotal, total } = useBooking();
  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-white/[0.08] bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
              {event.number}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{event.title}</h2>
          </div>
          <Link to="/booking" className="text-sm font-medium text-pink">
            Edit
          </Link>
        </div>
        <dl className="mt-4 border-t border-border">
          <Row label="Date" value={event.date} />
          <Row label="Time" value={event.time} />
          <Row label="Location" value={event.location} />
          <Row label="Passes" value={`${quantity} × Experience Pass`} />
          <Row label="Passes total" value={formatPrice(subtotal)} />
        </dl>
      </section>

      <section className="rounded-[16px] border border-white/[0.08] bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Guest Details</h2>
          <Link to="/booking/details" className="text-sm font-medium text-pink">
            Edit
          </Link>
        </div>
        <dl className="mt-4 border-t border-border">
          <Row label="Name" value={customer.name} />
          <Row label="Mobile" value={maskMobile(customer.mobile)} />
          <Row label="Email" value={customer.email} />
          {guestNames.trim() ? <Row label="Guests" value={guestNames} /> : null}
        </dl>
        <p className="mt-4 text-sm text-text-secondary">
          Number of passes: {quantity}. Primary booker: {customer.name}.
        </p>
      </section>

      <section className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Payment</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Payment will be completed in the next step. Your booking will be created as
          Payment Pending.
        </p>
        <p className="mt-4 text-2xl font-bold text-white">{formatPrice(total)}</p>
      </section>
    </div>
  );
}
