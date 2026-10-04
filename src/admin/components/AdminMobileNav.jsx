export default function AdminMobileNav({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative h-full w-[min(280px,86vw)] border-r border-border">{children}</div>
    </div>
  );
}
