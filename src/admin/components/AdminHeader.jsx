import { Menu } from "lucide-react";

export default function AdminHeader({ onMenu, title = "Admin", environment = "" }) {
  const label = environment === "production" ? "Production" : environment === "staging" ? "Staging" : environment ? "Development" : "";
  const tone =
    environment === "production"
      ? "border-pink/40 bg-pink/10 text-pink"
      : environment === "staging"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-border text-text-muted";
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg border border-border p-2 text-white md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <p className="text-sm font-semibold tracking-[0.16em] text-white md:hidden">
        MOMNT <span className="font-normal tracking-normal text-text-muted">{title}</span>
      </p>
      <div className="hidden items-center gap-3 md:flex">
        <p className="text-sm text-text-muted">Internal console</p>
        {label ? <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span> : null}
      </div>
    </header>
  );
}
