import { classNames } from "../../utils/helpers";

export default function Container({
  as: Tag = "div",
  className = "",
  children,
}) {
  return (
    <Tag
      className={classNames(
        "mx-auto w-full max-w-[1280px] px-5 md:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
