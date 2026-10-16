import { useEffect, useRef } from "react";

// A clean cursor: a small dot on the pointer, a ring that glides after it, and a short,
// thin fading trail in the logo's blue-to-green. The ring grows over anything clickable
// and gives a soft pulse on click. Mouse and trackpad only; off for reduced motion.

const LIGHT_SURFACES = ".sky-hero, .page-intro, .sky-band, .site-footer, .join-band, .donate-box, .reader-bar, .reader-stage-outer";
const HOVER_TARGETS = "a, button, [role='button'], label, select, summary, .sheet-link, [data-cursor='hover']";
const HIDE = ".impact-splide .splide__track, input, textarea, [contenteditable='true']";

export default function CursorTrail({ enabled = true }) {
  const canvasRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current, ring = ringRef.current, dot = dotRef.current;
    if (!fine || reduce || !canvas || !ring || !dot) return;

    document.documentElement.classList.add("has-cursor");
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const p = { x: -100, y: -100, inside: false };
    const ringPos = { x: -100, y: -100 };
    let trail = [];
    let onLight = false;
    let state = "";
    let raf = 0, last = performance.now(), lastSense = 0;

    const setState = (s) => {
      if (s === state) return;
      state = s;
      const cls = `${s}${onLight ? " on-light" : ""}`;
      const pulsing = ring.classList.contains("pulse");
      ring.className = `cursor-ring ${cls}${pulsing ? " pulse" : ""}`;
      dot.className = `cursor-dot ${cls}`;
    };
    const sense = () => {
      const el = document.elementFromPoint(p.x, p.y);
      const light = !!el?.closest(LIGHT_SURFACES);
      const next = !el || el.closest(HIDE) ? "is-hidden" : el.closest(HOVER_TARGETS) ? "is-hover" : "";
      if (light !== onLight) { onLight = light; state = "__"; }
      setState(next + (p.down ? " is-down" : ""));
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (!p.inside) {
        p.inside = true;
        ringPos.x = e.clientX; ringPos.y = e.clientY;
        trail = [];
        ring.style.opacity = dot.style.opacity = "1";
      }
      p.x = e.clientX; p.y = e.clientY;
      dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      const now = performance.now();
      if (now - lastSense > 80) { lastSense = now; sense(); }
      start();
    };
    const onLeave = () => { p.inside = false; ring.style.opacity = dot.style.opacity = "0"; };
    const onDown = () => { p.down = true; sense(); ring.classList.remove("pulse"); void ring.offsetWidth; ring.classList.add("pulse"); };
    const onUp = () => { p.down = false; sense(); };
    ring.addEventListener("animationend", () => ring.classList.remove("pulse"));
    const onScroll = () => { if (p.inside) sense(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-dt * 12);
      ringPos.x += (p.x - ringPos.x) * k;
      ringPos.y += (p.y - ringPos.y) * k;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;

      if (p.inside) {
        trail.unshift({ x: p.x, y: p.y });
        if (trail.length > 14) trail.length = 14;
      }
      const prev = trail[1];
      if (prev && Math.hypot(prev.x - p.x, prev.y - p.y) < 0.5 && trail.length > 1) trail.length -= 1;

      ctx.clearRect(0, 0, W, H);
      if (trail.length > 2) {
        const head = trail[0], tail = trail[trail.length - 1];
        const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
        if (onLight) {
          grad.addColorStop(0, "rgba(255,255,255,0.75)");
          grad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          grad.addColorStop(0, "rgba(51,204,52,0.7)");
          grad.addColorStop(0.5, "rgba(51,143,104,0.4)");
          grad.addColorStop(1, "rgba(54,84,157,0)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        for (let i = 1; i < trail.length - 1; i++) {
          const a = trail[i], b = trail[i + 1];
          ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        }
        ctx.stroke();
      }

      const settled = trail.length <= 1 && Math.hypot(ringPos.x - p.x, ringPos.y - p.y) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(frame);
      if (settled) ctx.clearRect(0, 0, W, H);
    }

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" style={{ opacity: 0 }} />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" style={{ opacity: 0 }} />
    </>
  );
}
