import PageTransition from "../components/layout/PageTransition";
import Container from "../components/layout/Container";
import SectionHeading from "../components/ui/SectionHeading";
import usePageMeta from "../utils/usePageMeta";

const sections = [
  {
    id: "who",
    title: "Who this policy covers",
    paragraphs: [
      "This policy explains how MOMNT handles personal information when you use themomnt.club to create an account, reserve a pass, or pay for a private experience.",
      "MOMNT hosts small private events. The first experiences are in Ahmedabad.",
    ],
  },
  {
    id: "collect",
    title: "Information we collect",
    paragraphs: [
      "When you create an account, we collect your name, mobile number, and email address. Your password is stored only as a secure hash. We never keep the password you type.",
      "When you reserve a pass, we store the experience, the number of passes, the amount, and any optional guest names you add. Your booking is tied to the name, mobile number, and email on your account.",
      "When you pay, you pay the official MOMNT UPI ID from your own UPI app. We then store the UTR you submit, the payer name, and, if you provide them, the payer UPI ID and transaction date. We do not collect card numbers or bank account numbers.",
      "After a payment is approved, we create a digital pass for that booking, including a ticket reference used at the door.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    paragraphs: [
      "We use this information to create your account, hold your passes, show your booking status, and let you cancel before a payment is approved.",
      "We use the UTR and payer details to check that the payment matches your booking. Submitting a UTR does not by itself mark a booking as paid. A MOMNT organiser confirms it.",
      "We use your contact details to tell you about that booking, including approval, a refused payment, or entry on the day. We use the guest list and ticket to admit the people named on confirmed bookings.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and sign-in",
    paragraphs: [
      "When you sign in, the site stores a login cookie and a security cookie in your browser. They keep you signed in and protect booking and payment actions. They are not used for advertising.",
      "Signing out clears the login session. You can also clear cookies in your browser.",
    ],
  },
  {
    id: "share",
    title: "Who we share it with",
    paragraphs: [
      "We do not sell personal information.",
      "Event staff can see the guest list and ticket so they can check guests in. The people who verify payments can see the booking amount, UTR, and payer details.",
      "The website, the booking service, and the database are hosted by service providers. They process this information only so MOMNT can run.",
    ],
  },
  {
    id: "keep",
    title: "How long we keep it",
    paragraphs: [
      "We keep account, booking, and payment records for as long as we need them to run the experience, answer a question about your booking, and keep a record of the payment.",
      "If you ask us to close an account, we can remove the sign-in details we no longer need. We may still keep the booking and payment record where we need it for a dispute or a legal obligation.",
    ],
  },
  {
    id: "choices",
    title: "Your choices",
    paragraphs: [
      "You can review your bookings while you are signed in. You can cancel a booking before the payment is approved. An approved booking cannot be cancelled from the site.",
      "To correct your name, mobile number, or email, or to ask what we hold about you, write to us from the email address on your account. We will use that address to confirm the request is yours.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "MOMNT accounts and passes are for adults. We do not knowingly collect information from children.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "If we change what we collect or how we use it, we will update this page and the date above.",
    ],
  },
];

export default function Privacy() {
  usePageMeta({
    title: "Privacy Policy — MOMNT",
    description: "How MOMNT collects and uses account, booking, and payment information.",
  });

  return (
    <PageTransition>
      <Container className="py-16 lg:py-24">
        <SectionHeading
          as="h1"
          eyebrow="MOMNT"
          title="Privacy Policy"
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
        </div>
      </Container>
    </PageTransition>
  );
}
