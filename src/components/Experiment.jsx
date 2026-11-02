import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SplitWords from "../motion/SplitWords.jsx";
import { lockScroll } from "../motion/smoothScroll.js";
import { createFoam } from "../motion/foam.js";

// A tiny hands-on lab: build elephant toothpaste one ingredient at a time. When the yeast goes in,
// the foam gushes out of the flask and fills the whole screen.

const DYES = [
  { name: "Green", hex: "#33cc34" },
  { name: "Blue", hex: "#3e6fd8" },
  { name: "Pink", hex: "#ff5fa2" },
  { name: "Orange", hex: "#ff9d2e" },
  { name: "Purple", hex: "#8b5cf6" },
];

const STEPS = [
  {
    id: "peroxide",
    name: "Hydrogen peroxide",
    tag: "H₂O₂",
    pour: "#cfe8ff",
    say: "Hydrogen peroxide is in. On its own it slowly breaks down into water and oxygen, way too slowly to notice.",
  },
  {
    id: "soap",
    name: "Dish soap",
    tag: "Soap",
    pour: "#f6d55c",
    say: "Soap added. It will trap the oxygen gas in millions of tiny bubbles. No soap, no foam.",
  },
  {
    id: "dye",
    name: "Food coloring",
    tag: "Dye",
    pour: null,
    say: "Nice color. Add up to three for stripes, or move on to the yeast.",
  },
  {
    id: "yeast",
    name: "Yeast + warm water",
    tag: "Catalyst",
    pour: "#d9b98c",
    say: "Yeast is the catalyst. Stand back…",
  },
];

const START = "Add the ingredients in order. Start with the hydrogen peroxide.";

function Bottle({ step, color }) {
  // simple line-drawn bottles, one shape per ingredient
  const fill = color || step.pour || "#ffffff";
  if (step.id === "peroxide")
    return (
      <svg viewBox="0 0 48 64" aria-hidden="true">
        <rect x="18" y="4" width="12" height="9" rx="2" fill="#fff" />
        <path d="M13 16h22a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z" fill="#7a4a2b" />
        <rect x="13" y="30" width="22" height="14" rx="2" fill="#fff" />
      </svg>
    );
  if (step.id === "soap")
    return (
      <svg viewBox="0 0 48 64" aria-hidden="true">
        <path d="M20 3h8v8h-8z" fill="#fff" />
        <path d="M17 11h14l5 9v34a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V20l5-9Z" fill={fill} />
        <circle cx="20" cy="34" r="3" fill="#fff" opacity=".8" /><circle cx="27" cy="42" r="2" fill="#fff" opacity=".8" />
      </svg>
    );
  if (step.id === "dye")
    return (
      <svg viewBox="0 0 48 64" aria-hidden="true">
        <path d="M24 2c4 6 7 9 7 14H17c0-5 3-8 7-14Z" fill="#fff" />
        <path d="M15 18h18a3 3 0 0 1 3 3v33a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V21a3 3 0 0 1 3-3Z" fill={fill} />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 64" aria-hidden="true">
      <path d="M8 22h32l-3 34a6 6 0 0 1-6 5H17a6 6 0 0 1-6-5L8 22Z" fill="#fff" />
      <path d="M10 34h28l-2 22a5 5 0 0 1-5 4H17a5 5 0 0 1-5-4l-2-22Z" fill={fill} />
      <circle cx="18" cy="44" r="1.6" fill="#7a5a33" /><circle cx="26" cy="50" r="1.6" fill="#7a5a33" /><circle cx="31" cy="42" r="1.6" fill="#7a5a33" />
    </svg>
  );
}

export default function Experiment() {
  const [done, setDone] = useState({ peroxide: false, soap: false, yeast: false });
  const [dyes, setDyes] = useState([]);
  const [pouring, setPouring] = useState(null);     // { color } while a pour animates
  const [phase, setPhase] = useState("build");     // build → react → erupt → full → (clean up) → build
  const [status, setStatus] = useState(START);
  const neckRef = useRef(null);
  const foamRef = useRef(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const level = (done.peroxide ? 0.42 : 0) + (done.soap ? 0.08 : 0) + (dyes.length ? 0.02 : 0) + (done.yeast ? 0.08 : 0);
  const liquid = dyes[0] || (done.soap ? "#e8f1c6" : "#d8ecff");
  const nextId = !done.peroxide ? "peroxide" : !done.soap ? "soap" : !done.yeast ? (dyes.length ? "yeast" : "dye") : null;

  function pour(color, after) {
    if (reduced) { after(); return; }
    setPouring({ color });
    setTimeout(() => { setPouring(null); after(); }, 900);
  }

  function add(step, dye) {
    if (pouring || phase !== "build") return;
    if (step.id === "dye") {
      if (!done.soap || dyes.length >= 3 || dyes.includes(dye.hex)) return;
      pour(dye.hex, () => {
        setDyes((d) => [...d, dye.hex]);
        setStatus(dyes.length === 0 ? `${dye.name} dye in. ${step.say}` : `${dye.name} added. That's ${dyes.length + 1} stripe colors.`);
      });
      return;
    }
    if (step.id === "soap" && !done.peroxide) return;
    if (step.id === "yeast" && !done.soap) return;
    pour(step.pour, () => {
      setDone((d) => ({ ...d, [step.id]: true }));
      setStatus(step.say);
      if (step.id === "yeast") react();
    });
  }

  function react() {
    setPhase("react");
    setTimeout(() => {
      const r = neckRef.current.getBoundingClientRect();
      setPhase("erupt");
      lockScroll(true);
      foamRef.current = createFoam({
        colors: dyes,
        origin: { x: r.left + r.width / 2, y: r.top + 6 },
        reducedMotion: reduced,
        onFull: () => setPhase("full"),
      });
    }, reduced ? 0 : 1400);
  }

  function cleanUp() {
    setPhase("draining");
    foamRef.current?.drain(() => {
      foamRef.current = null;
      lockScroll(false);
      setDone({ peroxide: false, soap: false, yeast: false });
      setDyes([]);
      setPhase("build");
      setStatus("All clean. Want to try a different color?");
    });
  }

  // Escape cleans up too; and never leave foam behind if the page changes
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && (phase === "full" || phase === "erupt")) cleanUp(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => () => { foamRef.current?.dispose(); lockScroll(false); }, []);

  const stepDone = (id) => (id === "dye" ? dyes.length > 0 : done[id]);
  const stepOpen = (id) =>
    phase === "build" && !pouring &&
    (id === "peroxide" ? !done.peroxide : id === "soap" ? done.peroxide && !done.soap : id === "dye" ? done.soap && !done.yeast && dyes.length < 3 : done.soap && !done.yeast);

  return (
    <section className="section lab" id="experiment">
      <div className="wrap lab-grid">
        <div className="lab-copy">
          <p className="lab-kicker" data-reveal="up">Try an experiment</p>
          <SplitWords>Make elephant toothpaste</SplitWords>
          <p className="lab-lede" data-reveal="up" style={{ "--d": 2 }}>
            A classic science fair demo, right here on the page. Add the four ingredients in order,
            then watch what one tiny catalyst can do.
          </p>
          <ol className="lab-steps" data-reveal="up" style={{ "--d": 3 }}>
            {STEPS.map((s, i) => (
              <li key={s.id} className={`${stepDone(s.id) ? "is-done" : ""} ${nextId === s.id && phase === "build" ? "is-next" : ""}`}>
                <span className="lab-num" aria-hidden="true">{stepDone(s.id) ? "✓" : i + 1}</span>
                <span><strong>{s.name}</strong>{s.id === "dye" ? " (optional, up to 3 for stripes)" : ""}</span>
              </li>
            ))}
          </ol>
          <p className="lab-safety" data-reveal="up" style={{ "--d": 4 }}>
            Doing it for real? Use 3% hydrogen peroxide from a pharmacy, wear goggles, and have an adult with you.
          </p>
        </div>

        <div data-reveal="up" style={{ "--d": 2 }}>
        <div className={`lab-bench phase-${phase}`}>
          <div className="flask-wrap">
            {pouring && (
              <div className="pour" style={{ "--pour": pouring.color }} aria-hidden="true"><span /></div>
            )}
            <svg className="flask" viewBox="0 0 200 250" aria-hidden="true">
              <defs>
                <clipPath id="flask-in">
                  <path d="M84 22v62L28 214a14 14 0 0 0 13 20h118a14 14 0 0 0 13-20L116 84V22Z" />
                </clipPath>
              </defs>
              <path className="flask-glass" d="M84 22v62L28 214a14 14 0 0 0 13 20h118a14 14 0 0 0 13-20L116 84V22Z" />
              <g clipPath="url(#flask-in)">
                <rect className="flask-liquid" x="0" width="200" height="250" style={{ fill: liquid, transform: `translateY(${234 - level * 234}px)` }} />
                {dyes.map((c, i) => (
                  <path key={c} className="dye-swirl" d={`M${70 + i * 30} 160c-14 18 14 30 0 48s12 26 4 40`} style={{ stroke: c, transform: `translateY(${(0.5 - level) * 150}px)` }} />
                ))}
                {done.soap && (
                  <g className="flask-bubbles">
                    {[60, 82, 100, 118, 140, 92, 128].map((x, i) => (
                      <circle key={i} cx={x} cy={226} r={2 + (i % 3)} style={{ animationDelay: `${i * 0.35}s` }} />
                    ))}
                  </g>
                )}
              </g>
              <path className="flask-line" d="M84 22v62L28 214a14 14 0 0 0 13 20h118a14 14 0 0 0 13-20L116 84V22" />
              <path className="flask-line" d="M76 22h48" />
              <path className="flask-shine" d="M98 40v40M60 190l20-38" />
              {(phase === "react" || phase === "erupt") && (
                <g className="neck-foam" style={{ "--foam": dyes[0] || "#fbf7ef" }}>
                  <circle cx="100" cy="24" r="16" /><circle cx="88" cy="16" r="11" /><circle cx="112" cy="14" r="12" /><circle cx="100" cy="4" r="10" />
                </g>
              )}
            </svg>
            <span className="flask-neck" ref={neckRef} aria-hidden="true" />
          </div>

          <p className="lab-status" aria-live="polite">{status}</p>

          <div className="lab-shelf">
            {STEPS.map((s) =>
              s.id === "dye" ? (
                <div key={s.id} className={`shelf-item shelf-dye ${stepOpen("dye") ? "is-open" : ""} ${dyes.length ? "is-done" : ""}`}>
                  <span className="shelf-label">{s.name}</span>
                  <div className="dye-row">
                    {DYES.map((d) => (
                      <button
                        key={d.hex}
                        type="button"
                        className={`dye ${dyes.includes(d.hex) ? "is-in" : ""}`}
                        style={{ "--dye": d.hex }}
                        disabled={!stepOpen("dye") || dyes.includes(d.hex)}
                        onClick={() => add(s, d)}
                        aria-label={`Add ${d.name.toLowerCase()} food coloring`}
                      >
                        <Bottle step={s} color={d.hex} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  key={s.id}
                  type="button"
                  className={`shelf-item ${stepOpen(s.id) ? "is-open" : ""} ${done[s.id] ? "is-done" : ""}`}
                  disabled={!stepOpen(s.id)}
                  onClick={() => add(s)}
                >
                  <Bottle step={s} />
                  <span className="shelf-label">{s.name}</span>
                  <span className="shelf-tag">{done[s.id] ? "Added" : s.tag}</span>
                </button>
              )
            )}
          </div>
        </div>
        </div>
      </div>

      {(phase === "full" || phase === "draining") &&
        createPortal(
          <div className={`foam-card-wrap ${phase === "draining" ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="foam-title">
            <div className="foam-card">
              <p className="lab-kicker">You made elephant toothpaste</p>
              <h2 id="foam-title">So what just happened?</h2>
              <p className="foam-eq">2 H₂O₂ → 2 H₂O + O₂</p>
              <p>
                Hydrogen peroxide breaks down into water and oxygen gas. Normally that takes ages, but yeast has an
                enzyme called <strong>catalase</strong> that speeds it up enormously. All that oxygen gets trapped in
                the soap, and out comes a tower of foam.
              </p>
              <p>
                The reaction gives off heat too (it's <strong>exothermic</strong>), so real foam feels warm.
                It's just soapy water and oxygen bubbles now.
              </p>
              <button type="button" className="btn btn-ink" onClick={cleanUp} autoFocus>Clean it up</button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
