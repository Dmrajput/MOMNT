import { classNames } from "../../utils/helpers";

export default function GlassCard({
  as: Tag = "div",
  children,
  className = "",
  interactive = false,
  ...props
}) {
  return (
    <Tag
      className={classNames(
        "rounded-[16px] border border-white/[0.08] bg-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[20px]",
        interactive && "transition-[border-color] duration-200 hover:border-white/20",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
