import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Badge from "./Badge";
import Button from "./Button";
import MediaImage from "./MediaImage";
import { classNames, eventPath, formatPrice } from "../../utils/helpers";

function MetaItem({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2">
      <Icon
        className="size-4 shrink-0 text-text-muted"
        aria-hidden="true"
        strokeWidth={1.75}
      />
      <span>{children}</span>
    </li>
  );
}

export default function EventCard({
  event,
  index = 0,
  headingLevel = 3,
  layout = "stacked",
}) {
  const reduce = useReducedMotion();
  const Title = headingLevel === 2 ? "h2" : "h3";
  const split = layout === "split";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.4,
        delay: reduce ? 0 : index * 0.08,
        ease: "easeOut",
      }}
      className={classNames(
        "group overflow-hidden border border-white/[0.08] bg-card shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-[border-color] duration-300 hover:border-white/20",
        split
          ? "rounded-[20px] lg:grid lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]"
          : "rounded-[16px]",
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <MediaImage
          src={event.image}
          alt={`${event.title} in ${event.location}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
        <div className="absolute top-4 left-4">
          <Badge tone="neutral">
            {event.badge || `Limited ${event.capacity} Passes`}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col p-6 lg:p-8">
        <p className="text-[13px] font-semibold tracking-[0.16em] text-pink">
          {event.number}
        </p>
        <Title className="mt-3 text-xl leading-snug font-bold tracking-[-0.02em] text-white md:text-2xl">
          <Link to={eventPath(event)} className="hover:text-white/80">
            {event.title}
          </Link>
        </Title>
        <ul className="mt-6 flex flex-col gap-3 text-sm text-text-secondary">
          <MetaItem icon={MapPin}>{event.location}</MetaItem>
          <MetaItem icon={CalendarDays}>{event.date}</MetaItem>
          <MetaItem icon={Clock3}>{event.time}</MetaItem>
        </ul>
        <div className="mt-8 flex flex-1 flex-col justify-end gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold text-white">
            {formatPrice(event.price)}
            <span className="ml-2 text-sm font-medium text-text-secondary">
              / person
            </span>
          </p>
          <Button
            to={eventPath(event)}
            variant="outline"
            arrow
            className="w-full sm:w-auto"
          >
            View Experience
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
