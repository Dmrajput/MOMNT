import Button from "../ui/Button";

const COPY = {
  TICKET_NOT_FOUND: "Your MOMNT access could not be found.",
  TICKET_NOT_AVAILABLE: "Your ticket is not available yet. Please complete payment verification.",
  NETWORK: "Unable to load your MOMNT access. Please try again.",
};

export default function TicketError({ error, onRetry }) {
  const message = COPY[error?.code] || COPY.NETWORK;
  return (
    <div className="mx-auto w-full max-w-xl rounded-[20px] border border-border bg-card p-6 md:p-8" role="alert">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">MOMNT Access</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{message}</h1>
      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={onRetry}>
          Try Again
        </Button>
        <Button to="/" variant="outline" fullWidth>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
