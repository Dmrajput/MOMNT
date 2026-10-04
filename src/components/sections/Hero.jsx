import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import MediaImage from "../ui/MediaImage";
import Container from "../layout/Container";
import { getFeaturedEvent } from "../../data/events";
import { eventPath, formatPrice } from "../../utils/helpers";

function motionProps(reduce, delay, y = 15) {
  return {
    initial: reduce ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0 : 0.5,
      delay: reduce ? 0 : delay,
      ease: "easeOut",
    },
  };
}

function Fact({ icon: Icon, label, value }) {
  return (
    <li className="flex items-center gap-3">
      <Icon
        className="size-4 shrink-0 text-text-muted"
        aria-hidden="true"
        strokeWidth={1.75}
      />
      <span className="text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="ml-2 font-medium text-white">{value}</span>
      </span>
    </li>
  );
}

export default function Hero() {
  const event = getFeaturedEvent();
  const reduce = useReducedMotion();

  if (!event) return null;

  return (
    <section className="pt-8 pb-[60px] lg:pt-12 lg:pb-24">
      <Container>
        <div className="grid items-center gap-10 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <motion.div {...motionProps(reduce, 0, 10)}>
              <Badge>Premium Private Experience</Badge>
            </motion.div>
            <motion.h1
              {...motionProps(reduce, 0.06)}
              className="mt-6 text-[42px] leading-[1.08] font-extrabold tracking-[-0.04em] text-white md:text-[52px] lg:text-[72px]"
            >
              Make It A
              <span className="text-gradient mt-1 block">MOMNT.</span>
            </motion.h1>
            <motion.p
              {...motionProps(reduce, 0.12)}
              className="mt-6 max-w-[450px] text-base leading-[1.5] text-text-secondary md:text-lg lg:text-[20px]"
            >
              Good people.
              <br />
              Great music.
              <br />
              Delicious food.
              <br />
              Unforgettable moments.
            </motion.p>
            <motion.ul
              {...motionProps(reduce, 0.18)}
              className="mt-8 flex flex-col gap-3"
            >
              <Fact icon={CalendarDays} label="Date" value={event.date} />
              <Fact icon={Clock3} label="Time" value={event.time} />
              <Fact icon={MapPin} label="Location" value={event.location} />
            </motion.ul>
            <motion.div {...motionProps(reduce, 0.24)} className="mt-8">
              <p className="text-[26px] leading-none font-bold text-white">
                {formatPrice(event.price)}
                <span className="ml-2 text-base font-medium text-text-secondary">
                  / person
                </span>
              </p>
              <p className="mt-3 text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
                {event.badge}
              </p>
              <Button
                to={eventPath(event)}
                size="lg"
                arrow
                className="mt-6 w-full px-5! text-[13px]! tracking-[0.04em] whitespace-nowrap uppercase sm:w-auto"
              >
                Reserve Your MOMNT
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="relative"
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.1, ease: "easeOut" }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,104,69,0.16),transparent_46%),radial-gradient(circle_at_70%_70%,rgba(255,45,141,0.12),transparent_42%),radial-gradient(circle_at_50%_0%,rgba(155,77,255,0.1),transparent_50%)] blur-2xl lg:-inset-6"
            />
            <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <MediaImage
                src="/images/hero-event.jpg"
                alt="MOMNT premium private event"
                fetchPriority="high"
                className="aspect-[16/10] w-full object-cover lg:aspect-auto lg:h-[600px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              />
              <div className="absolute bottom-4 left-4 hidden w-[220px] rounded-[16px] border border-white/10 bg-[rgba(10,10,15,0.70)] p-4 backdrop-blur-xl lg:block">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
                  {event.number}
                </p>
                <p className="mt-2 text-sm leading-snug font-semibold text-white">
                  {event.title}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  {formatPrice(event.price)} / person
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
