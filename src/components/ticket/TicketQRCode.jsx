import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";

export default function TicketQRCode({ ticketId, used = false }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}/qr`);
        if (!response.ok) throw new Error("qr");
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ticketId]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[244px] rounded-[16px] bg-white p-3 lg:max-w-[304px]">
        {src ? (
          <img
            src={src}
            alt="MOMNT event access QR code"
            className="aspect-square w-full"
          />
        ) : (
          <div className="aspect-square w-full animate-pulse bg-neutral-200" role="status" aria-label="Loading QR code" />
        )}
      </div>
      {used ? <p className="mt-3 text-center text-sm text-text-secondary">Already used</p> : null}
      {failed ? (
        <p className="mt-3 text-center text-sm text-text-secondary" role="status">
          The QR code could not be loaded. Please try again.
        </p>
      ) : null}
    </div>
  );
}
