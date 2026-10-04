import { classNames } from "../../utils/helpers";

export default function SectionHeading({
  as: Tag = "h2",
  eyebrow,
  title,
  description,
  id,
  className = "",
}) {
  return (
    <div className={classNames("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="mb-4 text-[12px] font-semibold tracking-[0.18em] text-pink uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Tag
        id={id}
        className="text-[30px] leading-[1.12] font-extrabold tracking-[-0.03em] text-white md:text-[38px] lg:text-[48px]"
      >
        {title}
      </Tag>
      {description ? (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}
