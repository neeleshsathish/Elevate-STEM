import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "./interactions.js";

// Counts a stat like "1,050+" or "100+" up from zero the first time it scrolls into view.
function parse(value) {
  const m = String(value).match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!m) return null;
  return { prefix: m[1], n: Number(m[2].replace(/,/g, "")), suffix: m[3], commas: m[2].includes(",") };
}
// a simple comma formatter: much cheaper than toLocaleString, which runs every animation frame here
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmt = (p, n) => `${p.prefix}${p.commas ? commas(n) : n}${p.suffix}`;

export default function CountUp({ value, delay = 0, duration = 1.8 }) {
  const ref = useRef(null);
  const p = parse(value);
  // starts with the real number (same as the pre-rendered page), then counts up from zero
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!p || !motionAllowed()) { setShown(value); return; }
    let raf = 0, timer = 0;
    setShown(fmt(p, 0));
    const run = () => {
      const t0 = performance.now() + delay * 1000;
      const tick = (now) => {
        const t = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
        const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out expo
        setShown(fmt(p, Math.round(p.n * e)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { io.disconnect(); run(); }
    }, { threshold: 0.4 });
    io.observe(ref.current);
    // never leave a number stuck at zero
    timer = setTimeout(() => { io.disconnect(); if (!raf) run(); }, 6000);
    return () => { io.disconnect(); cancelAnimationFrame(raf); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref} className="count-up">{shown}</span>;
}
