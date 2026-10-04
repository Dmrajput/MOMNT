import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import MediaImage from "../components/ui/MediaImage";
import usePageMeta from "../utils/usePageMeta";

export default function About() {
  usePageMeta({
    title: "About MOMNT — Premium Private Experiences",
    description:
      "MOMNT creates premium private experiences where great people, music, food and entertainment come together.",
    image: "/images/event-photo.jpg",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              as="h1"
              title="We Create MOMNTS Worth Remembering."
            />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary">
              MOMNT creates premium private experiences where great people,
              music, food and entertainment come together.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
              We begin in Ahmedabad, with a room small enough to feel personal
              and considered enough to feel rare.
            </p>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-white/10">
            <MediaImage
              src="/images/event-photo.jpg"
              alt="Guests laughing while a photographer captures a MOMNT"
              className="aspect-[4/5] w-full object-cover sm:aspect-[16/11] lg:aspect-[4/5]"
            />
          </div>
        </div>
      </Container>
    </PageTransition>
  );
}
