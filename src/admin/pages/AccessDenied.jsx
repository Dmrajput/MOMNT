import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-6 py-10 text-center">
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="mt-2 text-sm text-text-secondary">You do not have permission to open this part of MOMNT Admin.</p>
      <Link to="/admin" className="mt-6 inline-block text-sm font-semibold text-pink">
        Back to your console
      </Link>
    </div>
  );
}
