import { Camera, Martini, Music2, Utensils } from "lucide-react";

const icons = {
  martini: Martini,
  music: Music2,
  utensils: Utensils,
  camera: Camera,
};

export default function FeatureIcon({ name, className = "size-5 text-pink" }) {
  const Icon = icons[name] ?? Martini;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
