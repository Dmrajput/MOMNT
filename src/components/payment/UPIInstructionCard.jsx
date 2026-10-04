import { useState } from "react";
import { Copy, Smartphone } from "lucide-react";
import Button from "../ui/Button";
import { formatPrice } from "../../utils/helpers";
import UPIQRCode from "./UPIQRCode";

const steps = [
  "Scan the QR code",
  "Pay the exact amount",
  "Complete the payment in your UPI app",
  "Copy your UTR / transaction reference",
  "Enter it below",
];

function canOpenUpiApp() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

export default function UPIInstructionCard({ payment, expired, onOpenApp }) {
  const [notice, setNotice] = useState("");
  const mobile = canOpenUpiApp();

  async function copy(label, value) {
    try {
      await copyText(value);
      setNotice(`${label} copied`);
    } catch {
      setNotice("Unable to copy. Please copy it manually.");
    }
  }

  return (
    <section className="rounded-[16px] border border-border bg-card p-5 sm:p-6">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">Pay via UPI</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Official MOMNT UPI ID</h2>
      <p className="mt-2 text-sm text-text-secondary">{payment.upiName}</p>
      <p className="mt-4 break-all text-xl font-semibold text-white">{payment.upiId}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          fullWidth
          disabled={expired}
          icon={<Copy className="size-4" aria-hidden="true" />}
          onClick={() => copy("UPI ID", payment.upiId)}
        >
          Copy UPI ID
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={expired}
          icon={<Copy className="size-4" aria-hidden="true" />}
          onClick={() => copy("Amount", String(payment.amount))}
        >
          Copy Amount
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={expired}
          icon={<Copy className="size-4" aria-hidden="true" />}
          onClick={() => copy("Booking ID", payment.bookingId)}
        >
          Copy Booking ID
        </Button>
      </div>
      {notice ? (
        <p role="status" className="mt-3 text-sm text-text-secondary">
          {notice}
        </p>
      ) : null}

      <div className="mt-8">
        <UPIQRCode value={payment.upiIntentUrl} />
        <p className="mt-4 text-center text-sm text-text-secondary">
          {mobile ? "Scan the QR code from another device" : "Scan the QR code with your UPI app"}
        </p>
      </div>

      {mobile ? (
        <Button
          className="mt-6"
          size="lg"
          fullWidth
          disabled={expired}
          icon={<Smartphone className="size-4" aria-hidden="true" />}
          onClick={onOpenApp}
        >
          Open UPI App
        </Button>
      ) : null}

      <ol className="mt-8 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm text-text-secondary">
            <span className="font-semibold text-pink">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-text-muted">Amount due {formatPrice(payment.amount)}</p>
    </section>
  );
}
