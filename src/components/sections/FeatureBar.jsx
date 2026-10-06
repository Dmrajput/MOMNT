import { motion, useReducedMotion } from "framer-motion";
import Container from "../layout/Container";
import FeatureIcon from "../ui/FeatureIcon";
import { experienceFeatures } from "../../data/features";
import { useEventCatalog } from "../../context/EventCatalogContext";

export default function FeatureBar() {
  const reduce = useReducedMotion();
  const { featured: event } = useEventCatalog();
  const features = experienceFeatures.filter((feature) =>
    event?.inclusions?.includes(feature.title),
  );

  if (!features.length) return null;

  return (
    <section aria-labelledby="included-heading" className="pb-[60px] lg:pb-20">
      <Container>
        <h2 id="included-heading" className="sr-only">
          What&apos;s included
        </h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.li
              key={feature.id}
              className="min-w-0"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : index * 0.05,
                ease: "easeOut",
              }}
            >
              <div className="group h-full rounded-[16px] border border-white/[0.07] bg-white/[0.025] px-5 py-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 motion-reduce:transform-none">
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition duration-300 group-hover:border-white/20 group-hover:bg-white/[0.08]">
                  <FeatureIcon name={feature.icon} className="size-4 text-pink" />
                </span>
                <h3 className="mt-4 text-base leading-snug font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] text-text-muted">{feature.detail}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
