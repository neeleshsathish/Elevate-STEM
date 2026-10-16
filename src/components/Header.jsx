import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { DISCORD, INSTAGRAM } from "../data.js";
import Logo from "./Logo.jsx";
import { lockScroll } from "../motion/smoothScroll.js";

const LINKS = [
  ["/resources", "Free guides"],
  ["/team", "Team"],
  ["/partners", "Partners"],
  ["/sponsors", "Sponsor us"],
  ["/donate", "Donate"],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let lastY = window.scrollY;
    // Slides away while scrolling down, comes back as soon as you scroll up.
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - lastY) > 6) { setHidden(y > lastY && y > 160); lastY = y; }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Every page opens on a sky header, so at the top the header is see-through with white text.
  const overSky = !scrolled && !open;

  useEffect(() => {
    lockScroll(open);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${overSky ? " is-over-sky" : ""}${hidden && !open ? " is-hidden" : ""}${open ? " menu-open" : ""}`}>
      <div className="wrap header-row">
        <NavLink to="/" className="brand" aria-label="Elevate STEM home">
          <Logo />
        </NavLink>

        <nav className="nav-desktop" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>

        <a className="btn btn-ink btn-sm header-cta" href={DISCORD} target="_blank" rel="noreferrer">
          Join the Discord
        </a>

        <button
          className="menu-btn"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav id="mobile-nav" className={`nav-mobile${open ? " is-open" : ""}`} aria-label="Main" data-lenis-prevent>
        <NavLink to="/" end>Home</NavLink>
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
        <div className="nav-mobile-actions">
          <a className="btn btn-ink" href={DISCORD} target="_blank" rel="noreferrer">Join the Discord</a>
          <a className="btn btn-outline" href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </nav>
    </header>
  );
}
