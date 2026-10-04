export default function FilterBar({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="text-sm text-text-secondary">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-white outline-none focus:border-pink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
