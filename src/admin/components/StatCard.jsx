export default function StatCard({ title, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-secondary">{title}</p>
        {Icon ? <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-text-muted">{detail}</p> : null}
    </article>
  );
}
