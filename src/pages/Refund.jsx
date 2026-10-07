import { Link } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import usePageMeta from "../utils/usePageMeta";

const sections = [
  {
    id: "amount",
    title: "What is refunded",
    paragraphs: [
      "If MOMNT refunds an approved payment, you receive 70% of the amount paid for that booking.",
      "MOMNT keeps 30%. That 30% is a deduction and is not refunded.",
    ],
  },
  {
    id: "before",
    title: "Before payment is approved",
    paragraphs: [
      "You can cancel from your bookings page before the payment is approved. That releases the passes.",
      "A payment that is still waiting for approval is not an approved payment, so the 30% deduction is not taken from it.",
    ],
  },
  {
    id: "after",
    title: "After payment is approved",
    paragraphs: [
      "An approved booking cannot be cancelled from the bookings page.",
      "If a refund of that approved payment is agreed, it is limited to 70% of the amount paid. The remaining 30% is kept.",
    ],
  },
  {
    id: "how",
    title: "How the 70% is calculated",
    paragraphs: [
      "The percentage applies to the amount paid on that booking, including every pass on it. It is not calculated on a later change in the experience price.",
      "Example: a payment of ₹3,000 is refunded as ₹2,100. The ₹900 deduction stays with MOMNT.",
    ],
  },
];

export default function Refund() {
  usePageMeta({
    title: "Refund Policy — MOMNT",
    description: "Approved MOMNT payments are refunded at 70%. A 30% deduction is kept.",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <SectionHeading
          as="h1"
          eyebrow="MOMNT"
          title="Refund Policy"
          description="Last updated 7 October 2026. A refund is 70% of the amount paid. 30% is kept."
        />
        <div className="mt-12 max-w-2xl space-y-12">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id} className="text-2xl font-bold tracking-[-0.02em] text-white">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-text-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
          <p className="leading-relaxed text-text-secondary">
            Reservations and cancellation are also covered in the{" "}
            <Link to="/terms" className="text-white underline underline-offset-4">
              Terms & Conditions
            </Link>
            .
          </p>
        </div>
      </Container>
    </PageTransition>
  );
}
