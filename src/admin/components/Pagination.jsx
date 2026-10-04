export default function Pagination({ page, totalPages, limit, total, onPage, onLimit }) {
  if (!total) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
      <p>
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex items-center gap-2">
        <label>
          <span className="sr-only">Rows per page</span>
          <select
            aria-label="Rows per page"
            value={limit}
            onChange={(event) => onLimit(Number(event.target.value))}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-white"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-white disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
