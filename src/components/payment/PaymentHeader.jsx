import { Link } from "react-router-dom";

export default function PaymentHeader() {
  return (
    <header className="border-b border-white/[0.08]">
      <div className="mx-auto flex h-[var(--header-height)] w-full max-w-[1200px] items-center justify-between px-5 md:px-6">
        <Link to="/" className="text-[15px] font-extrabold tracking-[0.22em] text-white">
          MOMNT
        </Link>
        <p className="text-sm text-text-secondary">Secure Payment</p>
      </div>
    </header>
  );
}
