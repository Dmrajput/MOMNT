import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import faqs from "../data/faq";
import { classNames } from "../utils/helpers";
import usePageMeta from "../utils/usePageMeta";

function FaqItem({ item, open, onToggle }) {
  const reduce = useReducedMotion();
  const panelId = `faq-panel-${item.id}`;
  const buttonId = `faq-button-${item.id}`;

  return (
    <div className="border-b border-border">
      <h2>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left text-base font-semibold text-white md:text-lg"
          onClick={onToggle}
        >
          <span>{item.question}</span>
          <ChevronDown
            className={classNames(
              "size-5 shrink-0 text-text-muted transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 leading-relaxed text-text-secondary">
              {item.answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState(faqs[0]?.id ?? null);

  usePageMeta({
    title: "MOMNT — Frequently Asked Questions",
    description:
      "Questions about MOMNT #01 in Ahmedabad, what the pass includes, and how reservations will work.",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <SectionHeading
          as="h1"
          title="Frequently Asked Questions"
          description="A few things guests ask before the day."
        />
        <div className="mt-10 max-w-3xl border-t border-border">
          {faqs.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
            />
          ))}
        </div>
      </Container>
    </PageTransition>
  );
}
