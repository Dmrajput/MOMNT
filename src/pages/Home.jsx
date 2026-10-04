import PageTransition from "../components/layout/PageTransition";
import Hero from "../components/sections/Hero";
import FeatureBar from "../components/sections/FeatureBar";
import FeaturedEvent from "../components/sections/FeaturedEvent";
import usePageMeta from "../utils/usePageMeta";

export default function Home() {
  usePageMeta({
    title: "MOMNT — Make It A MOMNT",
    description:
      "Premium private experiences in Ahmedabad. Great music, great food and unforgettable moments.",
  });

  return (
    <PageTransition>
      <Hero />
      <FeatureBar />
      <FeaturedEvent />
    </PageTransition>
  );
}
