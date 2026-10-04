import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function UPIQRCode({ value }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value) return undefined;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 240,
      color: { dark: "#11111A", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="mx-auto flex w-fit rounded-[16px] bg-white p-3">
      {src ? (
        <img src={src} alt="UPI payment QR code for this MOMNT booking" className="size-[220px]" />
      ) : (
        <div className="size-[220px] animate-pulse bg-black/5" />
      )}
    </div>
  );
}
