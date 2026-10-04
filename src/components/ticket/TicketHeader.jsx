import { Link } from "react-router-dom";

export default function TicketHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[960px] items-center justify-between px-5 py-5 md:px-0">
      <Link
        to="/"
        className="text-sm font-extrabold tracking-[0.22em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink"
      >
        MOMNT
      </Link>
      <Link
        to="/"
        className="text-sm font-semibold text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink"
      >
        Back
      </Link>
    </header>
  );
}
