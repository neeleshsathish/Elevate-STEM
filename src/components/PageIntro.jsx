import { useEffect, useRef, useState } from "react";
import SplitWords from "../motion/SplitWords.jsx";

// Sky header used at the top of every page: drifting clouds, the page title rising in
// word by word, and a floating 3D object for the page on the right (below on phones).
import { isSoftwareGL } from "../three/quality.js";

export default function PageIntro({ title, kicker, scene = "atom", covers, actions, children }) {
  const canvasRef = useRef(null);
  const introRef = useRef(null);
  const copyRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let disposed = false, handle = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isSoftwareGL()) return;
    import("../three/heroObjects.js")
      .then(({ createHeroObject }) => createHeroObject(canvasRef.current, { variant: scene, covers, reducedMotion }))
      .then((h) => {
        if (disposed) return h.dispose();
        handle = h;
        setStatus("ready");
      })
      .catch(() => !disposed && setStatus("failed"));
    return () => { disposed = true; handle?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Clouds shift with the mouse; the title drifts and fades as you scroll away.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = introRef.current;
    let raf = 0;
    const onMove = (e) => {
      el.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        if (copyRef.current) {
          copyRef.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
          copyRef.current.style.opacity = String(Math.max(0, 1 - y / 560));
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className={`page-intro is-${status}`} ref={introRef}>
      <div className="intro-clouds" aria-hidden="true">
        <span className="cloud c1" /><span className="cloud c2" /><span className="cloud c3" /><span className="cloud c4" />
      </div>
      <div className="wrap intro-grid">
        <div className="intro-copy" ref={copyRef}>
          <SplitWords as="h1" delay={1}>{title}</SplitWords>
          {children && <p className="lede" data-reveal="up" style={{ "--d": 5 }}>{children}</p>}
          {actions && <div className="btn-row" data-reveal="up" style={{ "--d": 7 }}>{actions}</div>}
        </div>
        <div className="intro-stage" aria-hidden="true">
          <canvas ref={canvasRef} className="intro-canvas" />
        </div>
      </div>
    </section>
  );
}
