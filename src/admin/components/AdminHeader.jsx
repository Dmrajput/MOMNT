import { Menu } from "lucide-react";

export default function AdminHeader({ onMenu, title = "Admin" }) {
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
      <p className="hidden text-sm text-text-muted md:block">Internal console</p>
    </header>
  );
}
