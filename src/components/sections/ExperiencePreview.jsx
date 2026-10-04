import { experienceFeatures } from "../../data/features";
import FeatureIcon from "../ui/FeatureIcon";
import MediaImage from "../ui/MediaImage";

export default function ExperiencePreview({ inclusions }) {
  const items = experienceFeatures.filter(
    (feature) => !inclusions || inclusions.includes(feature.title),
  );

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="min-w-0 overflow-hidden rounded-[16px] border border-border bg-card"
        >
          <div className="aspect-video overflow-hidden">
            <MediaImage
              src={item.image}
              alt={item.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-start gap-4 p-5">
            <FeatureIcon name={item.icon} className="mt-1 size-5 shrink-0 text-pink" />
            <div>
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.detail}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
