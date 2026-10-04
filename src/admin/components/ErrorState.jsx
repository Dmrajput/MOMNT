export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/10 px-6 py-8 text-center" role="alert">
      <p className="text-sm text-white">{message || "Something went wrong."}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-pink">
          Try again
        </button>
      ) : null}
    </div>
  );
}
