import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPrice } from "../../utils/helpers";

export default function PassSelector({ quantity, min, max, price, onChange }) {
  const reduce = useReducedMotion();
  const atMin = quantity <= min;
  const atMax = quantity >= max;

  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Experience Pass</p>
          <p className="mt-1 text-sm text-text-secondary">
            {formatPrice(price)} / person
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease passes"
            disabled={atMin}
            onClick={() => onChange(quantity - 1)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-[12px] border border-white/15 text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <motion.span
            key={quantity}
            aria-live="polite"
            aria-atomic="true"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-8 text-center text-lg font-semibold text-white"
          >
            {quantity}
          </motion.span>
          <button
            type="button"
            aria-label="Increase passes"
            disabled={atMax}
            onClick={() => onChange(quantity + 1)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-[12px] border border-white/15 text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-muted">Up to {max} passes per booking.</p>
    </div>
  );
}
