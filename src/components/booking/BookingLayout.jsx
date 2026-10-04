import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Container from "../layout/Container";
import BookingProgress from "./BookingProgress";
import OrderSummary from "./OrderSummary";
import useStepDirection from "./useStepDirection";

export function BookingStep({ children, actions }) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        {children}
        {actions ? <div className="mt-8 hidden lg:block">{actions}</div> : null}
      </div>
      <div className="lg:sticky lg:top-8">
        <OrderSummary />
      </div>
      {actions ? <div className="lg:hidden">{actions}</div> : null}
    </div>
  );
}

function BookingHeader() {
  return (
    <header className="border-b border-white/[0.08]">
      <Container className="flex h-[var(--header-height)] items-center justify-between">
        <Link to="/" className="text-[15px] font-extrabold tracking-[0.22em] text-white">
          MOMNT
        </Link>
        <p className="text-sm text-text-secondary">Secure Booking</p>
      </Container>
    </header>
  );
}

export default function BookingLayout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const direction = useStepDirection();

  return (
    <div className="min-h-screen">
      <a
        href="#booking-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-[12px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <BookingHeader />
      <main id="booking-main">
        <Container className="py-8 lg:py-12">
          <BookingProgress />
          <motion.div
            key={pathname}
            className="mt-8"
            initial={reduce ? false : { opacity: 0, x: direction * 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
