import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, Ticket, Users } from "lucide-react";
import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Divider from "../components/ui/Divider";
import GlassCard from "../components/ui/GlassCard";
import MediaImage from "../components/ui/MediaImage";
import ExperiencePreview from "../components/sections/ExperiencePreview";
import { getEventBySlug } from "../data/events";
import { useBooking } from "../context/BookingContext";
import { formatPrice } from "../utils/helpers";
import usePageMeta from "../utils/usePageMeta";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <dt className="flex items-center gap-2 text-sm text-text-muted">
        <Icon className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { startBooking } = useBooking();
  const event = getEventBySlug(slug);

  usePageMeta({
    title: event ? `${event.title} — MOMNT` : "Experience not found — MOMNT",
    description:
      event?.description ??
      "This MOMNT experience could not be found.",
    image: event?.image,
  });

  if (!event) {
    return (
      <PageTransition>
        <Container className="py-24">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-white md:text-[38px]">
            This experience isn&apos;t listed.
          </h1>
          <p className="mt-4 max-w-md text-text-secondary">
            The MOMNT you asked for isn&apos;t available.
          </p>
          <Button to="/experiences" arrow className="mt-8">
            View experiences
          </Button>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <article>
        <Container className="pt-8 pb-20 lg:pt-12 lg:pb-28">
          <div className="overflow-hidden rounded-[20px] border border-white/10">
            <MediaImage
              src={event.image}
              alt={`${event.title} in ${event.location}`}
              fetchPriority="high"
              className="aspect-[16/10] w-full object-cover md:aspect-video"
            />
          </div>

          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-16">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{event.status}</Badge>
                <Badge tone="purple">{event.location}</Badge>
              </div>
              <p className="mt-6 text-[13px] font-semibold tracking-[0.16em] text-pink">
                {event.number}
              </p>
              <h1 className="mt-3 text-[30px] leading-[1.12] font-extrabold tracking-[-0.03em] text-white md:text-[38px] lg:text-[48px]">
                {event.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
                {event.description}
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-sm text-white">
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-pink" aria-hidden="true" />
                  {event.location}
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="size-4 text-pink" aria-hidden="true" />
                  {event.date}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-pink" aria-hidden="true" />
                  {event.time}
                </li>
              </ul>
              <div className="mt-8">
                <p className="text-2xl font-bold text-white">
                  {formatPrice(event.price)}
                  <span className="ml-2 text-base font-medium text-text-secondary">
                    / person
                  </span>
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Limited {event.capacity} Passes
                </p>
              </div>
              <div className="mt-6 max-w-sm">
                <Button
                  size="lg"
                  arrow
                  fullWidth
                  onClick={() => {
                    startBooking(event);
                    navigate("/booking");
                  }}
                >
                  Reserve Your MOMNT
                </Button>
              </div>
            </div>

            <GlassCard className="p-6">
              <h2 className="text-[12px] font-semibold tracking-[0.16em] text-text-muted uppercase">
                Event information
              </h2>
              <dl className="mt-2">
                <InfoRow icon={Calendar} label="Date" value={event.date} />
                <InfoRow icon={Clock} label="Time" value={event.time} />
                <InfoRow icon={MapPin} label="Location" value={event.location} />
                <InfoRow
                  icon={Users}
                  label="Capacity"
                  value={`${event.capacity} passes`}
                />
                <InfoRow
                  icon={Ticket}
                  label="Price"
                  value={`${formatPrice(event.price)} / person`}
                />
              </dl>
            </GlassCard>
          </div>

          <Divider className="my-16" />

          <section aria-labelledby="about-experience">
            <h2
              id="about-experience"
              className="text-2xl font-bold tracking-[-0.02em] text-white md:text-[30px]"
            >
              About the experience
            </h2>
            <div className="mt-6 max-w-2xl space-y-4">
              {event.about.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-text-secondary">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section aria-labelledby="included" className="mt-16">
            <h2
              id="included"
              className="text-2xl font-bold tracking-[-0.02em] text-white md:text-[30px]"
            >
              What&apos;s included
            </h2>
            <div className="mt-8">
              <ExperiencePreview inclusions={event.inclusions} />
            </div>
          </section>

          <section aria-labelledby="schedule" className="mt-16">
            <h2
              id="schedule"
              className="text-2xl font-bold tracking-[-0.02em] text-white md:text-[30px]"
            >
              Event schedule
            </h2>
            <ol className="mt-8 max-w-3xl border-t border-border">
              {event.schedule.map((item) => (
                <li
                  key={item.time}
                  className="grid gap-2 border-b border-border py-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-baseline"
                >
                  <p className="text-sm font-semibold text-pink">{item.time}</p>
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-text-secondary">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Container>
      </article>
    </PageTransition>
  );
}
