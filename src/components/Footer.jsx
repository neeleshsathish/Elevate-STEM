import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DISCORD, INSTAGRAM, asset } from "../data.js";
import Logo from "./Logo.jsx";
import { isSoftwareGL } from "../three/quality.js";
import { scrollToTopSmooth } from "../motion/smoothScroll.js";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
);
const WORD = "ELEVATE STEM";

// Glossy 3D mini logos that rain down from the top of the footer and pile up at the bottom.
// The 3D and physics code only loads once the footer is close to the screen.
function LogoPile() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    let pile = null, cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      near.disconnect();
      const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 100));
      idle(() => {
      if (cancelled || isSoftwareGL()) return;
      import("../motion/logoPile.js")
        .then(({ createLogoPile }) => {
          if (cancelled) return;
          const footer = canvas.parentElement;
          pile = createLogoPile(canvas, {
            src: asset("brand/logo-512.png"),
            reducedMotion,
            eventTarget: footer,
            // the heap fills the space under the copyright line
            pileHeight: () => parseFloat(getComputedStyle(footer).paddingBottom) + 40,
          });
        })
        .catch(() => canvas.remove());
      });
    }, { rootMargin: "600px 0px" });
    near.observe(canvas);
    return () => { cancelled = true; near.disconnect(); pile?.dispose(); };
  }, []);
  return <canvas ref={ref} className="footer-rain" aria-hidden="true" />;
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true"><span /><span /></div>

      <div className="wrap footer-grid">
        <div className="footer-brand" data-reveal="up">
          <Logo light />
          <p>A student-run nonprofit making STEM research and college pathways open to everyone. Built by students, for students.</p>
          <div className="footer-social">
            <a className="social-btn" href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram <Arrow /></a>
            <a className="social-btn" href={DISCORD} target="_blank" rel="noreferrer">Discord <Arrow /></a>
          </div>
        </div>
        <nav aria-label="Programs" data-reveal="up" style={{ "--d": 1 }}>
          <h2>Programs</h2>
          <Link to="/resources">Free guides</Link>
          <Link to="/donate">STEM kit drive</Link>
          <Link to="/sponsors">Sponsor a program</Link>
        </nav>
        <nav aria-label="Organization" data-reveal="up" style={{ "--d": 2 }}>
          <h2>Organization</h2>
          <Link to="/team">Team</Link>
          <Link to="/partners">Partners</Link>
          <Link to="/donate">Donate</Link>
        </nav>
        <nav aria-label="Community" data-reveal="up" style={{ "--d": 3 }}>
          <h2>Community</h2>
          <a href={DISCORD} target="_blank" rel="noreferrer">Discord server</a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">@elevatestem</a>
        </nav>
      </div>

      <div className="footer-wordmark" data-reveal="words" aria-hidden="true">
        {WORD.split("").map((ch, i) =>
          ch === " " ? (
            <span className="fw-space" key={i} />
          ) : (
            <span className="sw" key={i}><span className="sw-in" style={{ "--wi": i }}>{ch}</span></span>
          )
        )}
      </div>

      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} Elevate STEM Foundation</span>
        <button type="button" className="to-top" onClick={scrollToTopSmooth}>
          Back to top
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
      </div>

      <LogoPile />
    </footer>
  );
}
