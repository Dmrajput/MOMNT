import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import Button from "../ui/Button";
import { reservePath } from "../../data/site";
import { useAuth } from "../../context/AuthContext";
import { classNames } from "../../utils/helpers";

export default function MobileMenu({ open, onClose, links }) {
  const panelRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = panelRef.current;
    const getItems = () =>
      node
        ? [...node.querySelectorAll("a[href], button:not([disabled])")]
        : [];

    getItems()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const items = getItems();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-x-0 bottom-0 z-40 bg-black/55 lg:hidden"
            style={{ top: "var(--header-height)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
          />
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-x-0 z-50 border-b border-border bg-bg/95 px-5 py-6 backdrop-blur-xl lg:hidden"
            style={{ top: "var(--header-height)" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        classNames(
                          "flex min-h-12 items-center border-b border-border text-base font-medium text-text-secondary",
                          isActive && "text-white",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <span
                          className={classNames(
                            "border-b py-3",
                            isActive
                              ? "border-pink text-white"
                              : "border-transparent",
                          )}
                        >
                          {link.label}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            {user ? (
              <button
                type="button"
                className="mt-4 text-left text-sm font-medium text-text-secondary"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Log out
              </button>
            ) : (
              <Link to="/login" onClick={onClose} className="mt-4 inline-flex text-sm font-medium text-white">
                Login
              </Link>
            )}
            <Button
              to={user ? reservePath : "/login"}
              state={user ? undefined : { from: reservePath }}
              arrow
              fullWidth
              className="mt-6"
              onClick={onClose}
            >
              Reserve Now
            </Button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
