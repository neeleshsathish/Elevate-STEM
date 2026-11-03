// Smooth, eased page scrolling (Lenis). Turned off for people who prefer reduced motion
// and on touch screens, where native scrolling already feels right.
import Lenis from "lenis";

let lenis = null;

export function startSmoothScroll() {
  if (lenis || typeof window === "undefined") return lenis;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(hover: none)").matches;
  if (reduce || touch) return null;

  lenis = new Lenis({
    duration: 0.9,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    wheelMultiplier: 1,
  });
  const raf = (time) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  return lenis;
}

export const getLenis = () => lenis;

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToTopSmooth() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToElement(el, offset = -72) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function lockScroll(locked) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.body.style.overflow = locked ? "hidden" : "";
}
