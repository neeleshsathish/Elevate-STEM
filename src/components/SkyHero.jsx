import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DISCORD, STATS, HUB_CARDS } from "../data.js";
import SplitWords from "../motion/SplitWords.jsx";
import { isSoftwareGL } from "../three/quality.js";
import CountUp from "../motion/CountUp.jsx";
import { scrollToElement } from "../motion/smoothScroll.js";

function goTo(card, navigate) {
  if (card.href) window.open(card.href, "_blank", "noopener");
  else if (card.to.startsWith("#")) scrollToElement(document.querySelector(card.to));
  else navigate(card.to);
}

export default function SkyHero() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | ready | failed
  const [hovered, setHovered] = useState(null);
  const copyRef = useRef(null);

  // As you scroll down, the headline drifts up and fades a little slower than the page.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        const el = copyRef.current;
        if (!el) return;
        el.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
        el.style.opacity = String(Math.max(0, 1 - y / 620));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The 3D only starts once the page has finished loading and the browser is idle,
    // so the headline, buttons and stats are never held up by it.
    const start = () => import("../three/atomScene.js")
      .then(({ createAtomScene }) =>
        createAtomScene(canvasRef.current, {
          cards: HUB_CARDS,
          reducedMotion,
          onSelect: (card) => goTo(card, navigate),
          onHoverChange: (card) => setHovered(card),
        })
      )
      .then((s) => {
        if (disposed) return s.dispose();
        sceneRef.current = s;
        setStatus("ready");
      })
      .catch(() => !disposed && setStatus("failed"));
    const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
    // no graphics chip: keep the painted sky instead of a 3D scene that would make the page lag
    const kick = () => idle(() => { if (disposed) return; if (isSoftwareGL()) setStatus("failed"); else start(); });
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener("load", kick);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [navigate]);

  return (
    <section className={`sky-hero is-${status}`}>
      <div className="sky-clouds" aria-hidden="true" />

      <div className="sky-stage">
        <canvas ref={canvasRef} className="sky-canvas" aria-hidden="true" />
      </div>

      <div className="wrap sky-copy" ref={copyRef}>
        <SplitWords as="h1" delay={1}>Real STEM research starts in high school.</SplitWords>
        <p className="sky-lede" data-reveal="up" style={{ "--d": 7 }}>
          Free research guides, hands-on workshops, and science kits for kids who need them,
          plus a community of 1,050+ members who help each other get started.
        </p>
        <div className="btn-row" data-reveal="up" style={{ "--d": 9 }}>
          <Link className="btn btn-white" to="/resources">Read the free guides</Link>
          <a className="btn btn-glass" href={DISCORD} target="_blank" rel="noreferrer">Join the Discord</a>
        </div>
      </div>



      {status === "ready" && (
        <p className="sky-hint" aria-hidden="true">
          {hovered ? <>Click to open <strong>{hovered.title}</strong></> : "Drag to spin, click a card to open"}
        </p>
      )}

      {/* The cards in the 3D ring as plain links. They stay hidden until someone tabs to them,
          and focusing one turns the ring so that card faces the front. */}
      <nav className="sky-cards-nav" aria-label="Explore Elevate STEM">
        {HUB_CARDS.map((c, i) => {
          const onFocus = () => sceneRef.current?.focusCard(i);
          if (c.href) return <a key={c.id} href={c.href} target="_blank" rel="noreferrer" onFocus={onFocus}>{c.title}</a>;
          if (c.to.startsWith("#")) return <button key={c.id} type="button" onFocus={onFocus} onClick={() => goTo(c, navigate)}>{c.title}</button>;
          return <Link key={c.id} to={c.to} onFocus={onFocus}>{c.title}</Link>;
        })}
      </nav>

      <div className="wrap sky-stats-wrap">
        <dl className="sky-stats" data-reveal="up" style={{ "--d": 5 }}>
          {STATS.map((s, i) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd><CountUp value={s.value} delay={0.5 + i * 0.1} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
