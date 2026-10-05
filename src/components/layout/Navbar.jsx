import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Container from "./Container";
import MobileMenu from "./MobileMenu";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import { navLinks, reservePath } from "../../data/site";
import { useAuth } from "../../context/AuthContext";
import { classNames } from "../../utils/helpers";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuButtonRef = useRef(null);
  const openRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!openRef.current) return;
    setOpen(false);
    menuButtonRef.current?.focus();
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        aria-hidden="true"
        className={classNames(
          "absolute inset-0 -z-10 border-b transition-colors duration-300",
          scrolled
            ? "border-white/10 bg-[rgba(8,8,13,0.90)] backdrop-blur-xl"
            : "border-white/[0.08] bg-transparent backdrop-blur-md",
        )}
      />
      <Container className="relative flex h-[var(--header-height)] items-center justify-between">
        <Link
          to="/"
          className="relative z-10 text-[15px] font-extrabold tracking-[0.22em] text-white"
        >
          MOMNT
        </Link>

        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
        >
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    classNames(
                      "relative py-2 text-sm font-medium text-text-secondary transition-colors hover:text-white",
                      isActive && "text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      <span
                        aria-hidden="true"
                        className={classNames(
                          "absolute inset-x-0 -bottom-0.5 h-px origin-left bg-[linear-gradient(90deg,#FF6845,#FF2D8D)] transition-transform duration-200",
                          isActive ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative hidden items-center gap-6 lg:flex">
          {user ? (
            <button
              type="button"
              className="cursor-pointer text-sm font-medium text-text-secondary transition-colors hover:text-white"
              onClick={() => logout()}
            >
              {user.name.split(" ")[0]} · Log out
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-text-secondary transition-colors hover:text-white">
              Login
            </Link>
          )}
          <Button to={user ? reservePath : "/login"} size="sm" arrow state={user ? undefined : { from: reservePath }}>
            Reserve Now
          </Button>
        </div>

        <IconButton
          ref={menuButtonRef}
          label={open ? "Close menu" : "Open menu"}
          className="lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </IconButton>
      </Container>

      <MobileMenu open={open} onClose={closeMenu} links={navLinks} />
    </header>
  );
}
