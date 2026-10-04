import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { classNames } from "../../utils/helpers";

const variants = {
  primary:
    "bg-[linear-gradient(90deg,#FF6845,#FF2D8D)] text-white shadow-[0_8px_24px_rgba(255,45,141,0.22)]",
  secondary: "border border-border bg-card-elevated text-white hover:border-white/20",
  outline: "border border-white/15 bg-transparent text-white hover:border-white/30",
  ghost: "bg-transparent text-text-secondary hover:text-white",
};

const sizes = {
  sm: "min-h-9 px-4 text-[13px]",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-[52px] px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon = null,
  arrow = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  className = "",
  to,
  href,
  type = "button",
  ...props
}) {
  const classes = classNames(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] font-semibold tracking-[-0.01em] transition duration-200",
    variant === "primary"
      ? "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(255,45,141,0.28)]"
      : "hover:scale-[1.02]",
    "active:scale-[0.99] motion-reduce:transform-none",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant] ?? variants.primary,
    sizes[size] ?? sizes.md,
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      <span>{children}</span>
      {arrow && !loading ? (
        <ArrowRight className="size-4" aria-hidden="true" />
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
