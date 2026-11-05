import { useEffect, useRef, useState } from "react";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css/core";
import { IMPACT, asset } from "../data.js";
import SplitWords from "../motion/SplitWords.jsx";

const pad = (n) => String(n).padStart(2, "0");

// Each kind of picture gets a frame that suits it, so screenshots look like screens
// and the letter looks like paper instead of everything being cropped like a photo.
function Frame({ p, eager }) {
  const img = (
    <img
      src={asset(p.src.replace(/\.webp$/, "-s.webp"))}
      srcSet={p.w ? `${asset(p.src.replace(/\.webp$/, "-s.webp"))} ${p.sw}w, ${asset(p.src)} ${p.w}w` : undefined}
      sizes={`(max-width: 900px) ${Math.round(300 * p.r)}px, ${Math.round(470 * p.r)}px`}
      alt={p.caption} draggable="false" loading={eager ? "eager" : "lazy"} decoding="async"
    />
  );
  if (p.kind === "screen")
    return (
      <div className="fr fr-screen">
        <div className="fr-bar" aria-hidden="true"><i /><i /><i /><span>{p.app}</span></div>
        <div className="fr-body">{img}</div>
      </div>
    );
  if (p.kind === "phone") return <div className="fr fr-phone"><div className="fr-body">{img}</div></div>;
  if (p.kind === "doc") return <div className="fr fr-doc"><div className="fr-paper">{img}</div></div>;
  if (p.kind === "call") return <div className="fr fr-call"><div className="fr-body">{img}</div></div>;
  return <div className="fr fr-photo">{img}</div>;
}

// A looping strip you can drag, with a round "Drag" cursor on mouse/trackpad devices.
export default function ImpactSlider() {
  const rootRef = useRef(null);
  const splideRef = useRef(null);
  const cursorRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const splide = new Splide(rootRef.current, {
      type: "loop",
      autoWidth: true,
      focus: "center",
      gap: "22px",
      arrows: false,
      pagination: false,
      drag: true,
      flickPower: 300,
      flickMaxPages: 1,
      speed: reduce ? 0 : 700,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      keyboard: "focused",
      updateOnMove: true,
      i18n: { carousel: "photo carousel", slide: "photo", slideLabel: "%s of %s" },
    });
    splide.on("move", (i) => setIndex(i));
    splide.mount();
    splideRef.current = splide;
    // Re-measure once fonts and images settle, so the first photo is centered.
    const refresh = () => splide.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      splide.destroy();
    };
  }, []);

  // Custom cursor: follows the pointer over the strip, shrinks while dragging.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const track = rootRef.current?.querySelector(".splide__track");
    const cursor = cursorRef.current;
    if (!fine || !track || !cursor) return;

    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      });
    };
    const enter = (e) => { move(e); cursor.classList.add("is-on"); };
    const leave = () => cursor.classList.remove("is-on", "is-down");
    const down = () => cursor.classList.add("is-down");
    const up = () => cursor.classList.remove("is-down");

    track.classList.add("has-custom-cursor");
    track.addEventListener("pointerenter", enter);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerleave", leave);
    track.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("pointerenter", enter);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerleave", leave);
      track.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const go = (dir) => splideRef.current?.go(dir);

  return (
    <section className="impact" id="impact" aria-labelledby="impact-title">
      <div className="wrap impact-head">
        <SplitWords id="impact-title">Our impact so far</SplitWords>
        <p data-reveal="up" style={{ "--d": 3 }}>Kits in classrooms, workshops with researchers, and a community that keeps growing. Drag to look around.</p>
      </div>

      <div className="impact-stage" data-reveal="stage">

        <div className="splide impact-splide" ref={rootRef} aria-label="Photos of Elevate STEM's work">
          <div className="splide__track">
            <div className="splide__list">
              {IMPACT.map((p, i) => (
                <div className="splide__slide impact-slide" key={p.src} style={{ "--r": p.r }}>
                  <Frame p={p} eager={i < 4} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="wrap impact-foot" data-reveal="up" style={{ "--d": 2 }}>
        <p className="impact-caption" aria-live="polite">
          <span className="impact-count">{pad(index + 1)} / {pad(IMPACT.length)}</span>
          <span>{IMPACT[index].caption}</span>
        </p>
        <div className="impact-controls">
          <button className="impact-btn" onClick={() => go("<")} aria-label="Previous photo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button className="impact-btn" onClick={() => go(">")} aria-label="Next photo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="drag-cursor" ref={cursorRef} aria-hidden="true">
        <span>Drag</span>
      </div>
    </section>
  );
}
