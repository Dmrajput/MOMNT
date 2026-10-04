import { forwardRef } from "react";
import { classNames } from "../../utils/helpers";

const IconButton = forwardRef(function IconButton(
  { label, children, className = "", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={classNames(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-[12px] text-white transition hover:bg-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default IconButton;
