import { useState } from "react";
import { classNames } from "../../utils/helpers";

export default function MediaImage({
  src,
  alt,
  className = "",
  loading,
  fetchPriority,
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={classNames(
          "bg-[radial-gradient(circle_at_20%_15%,rgba(155,77,255,0.45),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(255,45,141,0.28),transparent_40%),linear-gradient(160deg,#151521,#08080D)]",
          className,
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => setFailed(true)}
    />
  );
}
