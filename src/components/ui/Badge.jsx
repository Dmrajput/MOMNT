import { classNames } from "../../utils/helpers";

const tones = {
  pink: "border-pink/35 text-pink",
  purple: "border-purple/35 text-purple",
  neutral: "border-white/15 text-text-secondary",
};

export default function Badge({ children, tone = "pink", className = "" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border bg-black/35 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase",
        tones[tone] ?? tones.pink,
        className,
      )}
    >
      {children}
    </span>
  );
}
