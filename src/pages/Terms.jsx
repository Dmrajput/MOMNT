import { Link } from "react-router-dom";
import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import usePageMeta from "../utils/usePageMeta";

const sections = [
  {
    id: "agreement",
    title: "Agreement",
    paragraphs: [
      "These terms apply when you use themomnt.club, create a MOMNT account, reserve a pass, or pay for a private experience.",
      "If you reserve a pass, you agree to these terms. The experience page shows the current date, time, place, price, and what is included.",
    ],
  },
  {
    id: "account",
    title: "Your account",
    paragraphs: [
      "You need an account before you can reserve a pass. Use your own name, a mobile number you can answer, and an email address you can open.",
      "You are responsible for activity on your account. You must be 18 or older to create an account and attend.",
    ],
  },
  {
    id: "booking",
    title: "Reservations",
    paragraphs: [
      "A reservation uses the name, mobile number, and email on your account. Guest names are optional. The pass is for the people named on that booking and is not for resale.",
      "You can reserve only the number of passes the booking form allows, and only while the experience still has passes left. The amount you owe is the amount MOMNT calculates for that booking, not a figure typed into the page.",
      "A reservation holds those passes while the booking is open. It is not a confirmed place until MOMNT approves the payment.",
    ],
  },
  {
    id: "payment",
    title: "Payment",
    paragraphs: [
      "Pay the exact amount shown to the official MOMNT UPI ID from your own UPI app. Then submit the UTR and the payer name on the payment page.",
      "Submitting a UTR asks MOMNT to check the payment. It does not mark the booking as paid. The booking is confirmed only after an organiser approves it.",
      "The payment page shows how long that session stays open. If it expires before you submit a UTR, the hold can be released and you will need a new reservation.",
    ],
  },
  {
    id: "entry",
    title: "Confirmation and entry",
    paragraphs: [
      "After approval, the booking shows as confirmed and a digital pass is created for it. Bring that pass to the experience. Entry is for the people on the confirmed booking.",
      "MOMNT can refuse entry where it is needed for the safety of the room, or where the pass does not match the booking.",
    ],
  },
  {
    id: "cancel",
    title: "Cancellation",
    paragraphs: [
      "You can cancel from your bookings page before the payment is approved. That releases the passes. A payment that is still waiting for approval is not treated as complete.",
      "After the payment is approved, the booking cannot be cancelled on the site. A refund of an approved payment returns 70% of the amount paid. MOMNT keeps 30%.",
      "If MOMNT cancels an experience, we will contact the email address on each confirmed booking.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    paragraphs: [
      "Details of an experience can be updated before you reserve. The experience page is the current description, price, and schedule.",
      "We may update these terms. The date at the top of this page is the current version. Reserving a pass after an update means you agree to the terms then shown.",
    ],
  },
];

export default function Terms() {
  usePageMeta({
    title: "Terms & Conditions — MOMNT",
    description: "The terms for a MOMNT account, reservation, payment, and entry.",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <SectionHeading
          as="h1"
          eyebrow="MOMNT"
          title="Terms & Conditions"
          description="Last updated 7 October 2026."
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
            Account, booking, and payment information is described in the{" "}
            <Link to="/privacy" className="text-white underline underline-offset-4">
              Privacy Policy
            </Link>
            . Refunds of an approved payment are described in the{" "}
            <Link to="/refund" className="text-white underline underline-offset-4">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </Container>
    </PageTransition>
  );
}
