// Site-wide motion, set up once:
//  - [data-reveal] elements animate in as they scroll into view
//  - [data-tilt] cards tilt toward the mouse with a soft glare
//  - buttons lean toward the mouse ("magnetic")
// Everything here is skipped for people who prefer reduced motion.

let started = false;

export function motionAllowed() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function startInteractions() {
  if (started || !motionAllowed()) return;
  started = true;
  document.documentElement.classList.add("has-motion");
  startReveals();
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    startTilt();
    startMagnetic();
  }
}

function startReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        reveal(en.target);
        // anything above this one that was skipped (fast scroll, jump links) shows too
        document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => {
          if (el.getBoundingClientRect().bottom < 0) reveal(el);
        });
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  function reveal(el) {
    el.classList.add("is-revealed");
    io.unobserve(el);
  }
  const watch = (root) => {
    if (root.matches?.("[data-reveal]:not(.is-revealed)")) io.observe(root);
    root.querySelectorAll?.("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));
  };
  watch(document.body);
  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && watch(n)));
  }).observe(document.body, { childList: true, subtree: true });
}

function startTilt() {
  let current = null;
  const reset = (el) => {
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      const el = e.target.closest?.("[data-tilt]");
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("is-tilting");
      el.style.setProperty("--rx", `${(-ny * 9).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(nx * 11).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${((nx + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${((ny + 0.5) * 100).toFixed(1)}%`);
    },
    { passive: true }
  );
  document.documentElement.addEventListener("mouseleave", () => current && reset(current));
}

function startMagnetic() {
  const SEL = ".btn, .impact-btn, .filter, .partner-pill";
  let current = null;
  const release = (el) => {
    el.style.setProperty("--magx", "0px");
    el.style.setProperty("--magy", "0px");
    el.classList.remove("is-magnet");
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      const el = e.target.closest?.(SEL);
      if (current && current !== el) release(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.classList.add("is-magnet");
      el.style.setProperty("--magx", `${(dx * 0.22).toFixed(1)}px`);
      el.style.setProperty("--magy", `${(dy * 0.3).toFixed(1)}px`);
    },
    { passive: true }
  );
}
