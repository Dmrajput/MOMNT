import { getFeaturedEvent } from "./events";

const featured = getFeaturedEvent();

export const reservePath = featured
  ? `/experiences/${featured.slug}`
  : "/experiences";

export const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/my-bookings", label: "Bookings" },
  { to: "/experiences", label: "Experiences" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export const footerLinks = navLinks.filter((link) => link.to !== "/");

export const socialLinks = [
  { href: "#instagram", label: "Instagram" },
  { href: "#facebook", label: "Facebook" },
];

export const legalLinks = [
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#terms", label: "Terms & Conditions" },
  { href: "#refund", label: "Refund Policy" },
];
