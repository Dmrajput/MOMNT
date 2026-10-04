import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import usePageMeta from "../utils/usePageMeta";

export default function NotFound() {
  usePageMeta({
    title: "Page not found — MOMNT",
    description: "This page is not part of MOMNT.",
  });

  return (
    <PageTransition>
      <Container className="py-24 lg:py-32">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-pink uppercase">
          404
        </p>
        <h1 className="mt-4 max-w-xl text-[30px] leading-[1.12] font-extrabold tracking-[-0.03em] text-white md:text-[38px] lg:text-[48px]">
          This page isn&apos;t a MOMNT.
        </h1>
        <p className="mt-4 max-w-md text-text-secondary">
          The link may be outdated. The experience you want is still on the
          homepage.
        </p>
        <Button to="/" arrow className="mt-8">
          Back home
        </Button>
      </Container>
    </PageTransition>
  );
}
