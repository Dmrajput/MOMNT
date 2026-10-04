import { statusMeta } from "../utils/adminHelpers";

const TONE = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  purple: "border-purple/30 bg-purple/10 text-purple",
  muted: "border-border bg-white/5 text-text-secondary",
};

export default function StatusBadge({ status }) {
  const [label, tone] = statusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}>
      {label}
    </span>
  );
}
