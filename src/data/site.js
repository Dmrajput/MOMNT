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
  { href: "https://www.instagram.com/themomntclub", label: "Instagram" },
  { href: "https://wa.me/919979130402", label: "WhatsApp" },
];

export const legalLinks = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/refund", label: "Refund Policy" },
];
