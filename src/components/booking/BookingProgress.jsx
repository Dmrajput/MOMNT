import { useLocation } from "react-router-dom";
import { classNames } from "../../utils/helpers";

const steps = [
  { id: "passes", label: "Passes", match: (path) => path === "/booking" },
  { id: "details", label: "Details", match: (path) => path.startsWith("/booking/details") },
  { id: "review", label: "Review", match: (path) => path.startsWith("/booking/review") },
  { id: "complete", label: "Complete", match: (path) => path.startsWith("/booking/success") },
];

export function stepIndex(pathname) {
  const index = steps.findIndex((step) => step.match(pathname));
  return index === -1 ? 0 : index;
}

export default function BookingProgress() {
  const { pathname } = useLocation();
  const current = stepIndex(pathname);

  return (
    <ol aria-label="Booking progress" className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => {
        const state = index < current ? "complete" : index === current ? "current" : "upcoming";
        return (
          <li key={step.id} aria-current={state === "current" ? "step" : undefined}>
            <div
              className={classNames(
                "border-t-2 pt-3",
                state === "upcoming" ? "border-border" : "border-pink",
              )}
            >
              <p
                className={classNames(
                  "text-[11px] font-semibold tracking-[0.14em]",
                  state === "upcoming" ? "text-text-muted" : "text-pink",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <p
                className={classNames(
                  "mt-1 text-[13px] font-medium sm:text-sm",
                  state === "upcoming" ? "text-text-muted" : "text-white",
                )}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
