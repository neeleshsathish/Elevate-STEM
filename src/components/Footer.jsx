import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DISCORD, INSTAGRAM, asset } from "../data.js";
import { scrollToTopSmooth } from "../motion/smoothScroll.js";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M10 8h6v6" /></svg>
);

// A strip of mini logos at the very bottom that tumble in and pile up.
// The physics code only loads once the footer is close to the screen.
function LogoPile() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    let pile = null, cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      near.disconnect();
      import("../motion/logoPile.js").then(({ createLogoPile }) => {
        if (cancelled) return;
        pile = createLogoPile(canvas, { src: asset("brand/logo-256.webp"), reducedMotion });
      });
    }, { rootMargin: "600px 0px" });
    near.observe(canvas);
    return () => { cancelled = true; near.disconnect(); pile?.dispose(); };
  }, []);
  return <canvas ref={ref} className="footer-pile" aria-hidden="true" />;
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-cols">
        <div className="fcol fcol-brand">
          <Link to="/" className="footer-logo" aria-label="Elevate STEM home">
            <img src={asset("brand/logo-256.webp")} alt="" width="56" height="56" />
            <span>Elevate STEM</span>
          </Link>
          <p>Built by students, for students. A student-run nonprofit opening up STEM research to everyone.</p>
        </div>

        <div className="fcol fcol-join">
          <h2>Join 1,050+ students</h2>
          <a className="fbtn fbtn-solid" href={DISCORD} target="_blank" rel="noreferrer">Join the Discord</a>
          <h2>Follow along</h2>
          <a className="fbtn fbtn-line" href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram <Arrow />
          </a>
        </div>

        <div className="fcol fcol-links">
          <nav aria-label="Footer">
            <Link to="/resources">Free guides <Arrow /></Link>
            <Link to="/team">Team <Arrow /></Link>
            <Link to="/partners">Partners <Arrow /></Link>
            <Link to="/sponsors">Sponsor a program <Arrow /></Link>
            <Link to="/donate">Donate <Arrow /></Link>
          </nav>
          <p className="footer-fine">
            © {new Date().getFullYear()} Elevate STEM. Our guides are free to read, print, and share.
          </p>
          <button type="button" className="to-top" onClick={scrollToTopSmooth}>Back to top ↑</button>
        </div>
      </div>

      <LogoPile />
    </footer>
  );
}
