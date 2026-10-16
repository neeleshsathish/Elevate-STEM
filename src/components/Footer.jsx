import { Link } from "react-router-dom";
import { DISCORD, INSTAGRAM } from "../data.js";
import Logo from "./Logo.jsx";
import { scrollToTopSmooth } from "../motion/smoothScroll.js";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
);
const WORD = "ELEVATE STEM";

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
    </footer>
  );
}
