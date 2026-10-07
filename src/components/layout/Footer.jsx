import { Link } from "react-router-dom";
import Container from "./Container";
import { footerLinks, legalLinks, socialLinks } from "../../data/site";

const quietLink = "text-sm text-text-secondary transition-colors hover:text-white";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <Container className="grid gap-10 py-[60px] md:grid-cols-3 lg:py-20">
        <div>
          <p className="text-sm font-extrabold tracking-[0.22em] text-white">
            MOMNT
          </p>
          <p className="mt-4 text-text-secondary">Make It A MOMNT.</p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-col gap-3">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={quietLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-1">
          <ul className="flex flex-col gap-3" aria-label="Social">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={quietLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={quietLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
