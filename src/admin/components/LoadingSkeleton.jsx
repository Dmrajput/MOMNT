export default function LoadingSkeleton({ variant = "table" }) {
  const bar = "animate-pulse rounded-lg bg-white/5";
  if (variant === "cards") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-border bg-card p-4">
            <div className={`${bar} h-3 w-24`} />
            <div className={`${bar} mt-4 h-7 w-20`} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "detail") {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className={`${bar} h-8 w-48`} />
        <div className={`${bar} h-40 w-full`} />
        <div className={`${bar} h-40 w-full`} />
      </div>
    );
  }
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={`${bar} h-12 w-full`} />
      ))}
    </div>
  );
}
