export default function TicketSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[960px] overflow-hidden rounded-[24px] border border-border bg-card" role="status" aria-label="Loading MOMNT access">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="min-h-[320px] animate-pulse bg-white/5" />
        <div className="space-y-4 p-6 md:p-8">
          <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-16 w-full animate-pulse rounded bg-white/10" />
          <div className="mx-auto h-[220px] w-[220px] animate-pulse rounded-[16px] bg-white/10" />
        </div>
      </div>
    </div>
  );
}
