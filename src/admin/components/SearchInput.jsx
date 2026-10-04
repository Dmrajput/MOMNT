export default function SearchInput({ value, onChange, placeholder = "Search bookings, customers, tickets...", label = "Search" }) {
  return (
    <label className="block min-w-[220px] flex-1">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-white outline-none placeholder:text-text-muted focus:border-pink"
      />
    </label>
  );
}
