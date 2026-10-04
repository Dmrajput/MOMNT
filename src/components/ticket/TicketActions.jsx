import { useState } from "react";
import { Download, QrCode, Share2 } from "lucide-react";
import Button from "../ui/Button";
import { downloadQr, downloadTicket, saveAccess, shareTicket } from "../../services/ticketService";

export default function TicketActions({ ticket }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const filename = `${ticket.ticketId}.png`;
  const shareText = `MOMNT Access — ${ticket.event.title}`;

  async function run(action, work) {
    setBusy(action);
    setNotice("");
    try {
      const result = await work();
      if (result === "copied") setNotice("Ticket link copied.");
      if (result === "shared") setNotice("Share sheet opened.");
      if (result === "downloaded") setNotice("Access image saved.");
      if (result?.status === "manual") setNotice(`Copy this link: ${result.url}`);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setNotice("Unable to complete that action. Please try again.");
    } finally {
      setBusy("");
    }
  }

  if (ticket.status !== "active") return null;

  return (
    <div className="mx-auto mt-6 flex w-full max-w-[960px] flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          fullWidth
          icon={<Download className="size-4" aria-hidden="true" />}
          loading={busy === "download"}
          onClick={() => run("download", () => downloadTicket(ticket, filename))}
        >
          Download Ticket
        </Button>
        <Button
          size="lg"
          variant="secondary"
          fullWidth
          loading={busy === "save"}
          onClick={() => run("save", () => saveAccess(ticket, filename, shareText))}
        >
          Save Access
        </Button>
        <Button
          size="lg"
          variant="secondary"
          fullWidth
          icon={<QrCode className="size-4" aria-hidden="true" />}
          loading={busy === "qr"}
          onClick={() => run("qr", () => downloadQr(ticket.ticketId, `${ticket.ticketId}-qr.png`))}
        >
          Download QR
        </Button>
        <Button
          size="lg"
          variant="outline"
          fullWidth
          icon={<Share2 className="size-4" aria-hidden="true" />}
          loading={busy === "share"}
          onClick={() =>
            run("share", () =>
              shareTicket({
                title: shareText,
                text: shareText,
                url: window.location.href,
              }),
            )
          }
        >
          Share
        </Button>
      </div>
      <p className="min-h-5 px-1 text-center text-sm break-all text-text-secondary" role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}
