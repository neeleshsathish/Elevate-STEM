import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SplitWords from "../motion/SplitWords.jsx";
import { lockScroll } from "../motion/smoothScroll.js";
import { isSoftwareGL } from "../three/quality.js";

// The eruption and the little UI animations use anime.js, loaded only when the experiment needs them,
// so none of it weighs down the first page load.
const loadFoam = () => import("../motion/foam.js");
const loadAnime = () => import("animejs");

// A hands-on lab: make elephant toothpaste on a 3D bench, one ingredient at a time.
// When the yeast goes in, foam gushes out of the flask and fills the whole screen.

const DYES = [
  { name: "Green", hex: "#33cc34" },
  { name: "Blue", hex: "#3e6fd8" },
  { name: "Pink", hex: "#ff5fa2" },
  { name: "Orange", hex: "#ff9d2e" },
  { name: "Purple", hex: "#8b5cf6" },
];

const STEPS = [
  { id: "peroxide", title: "Pour in hydrogen peroxide", short: "Peroxide", amount: "½ cup" },
  { id: "soap", title: "Squeeze in dish soap", short: "Dish soap", amount: "2 tbsp" },
  { id: "dye", title: "Add food coloring", short: "Food coloring", amount: "Pick up to 3" },
  { id: "yeast", title: "Add the yeast", short: "Yeast", amount: "1 packet" },
];

// Shelf icons, from the "Elephant Toothpaste Lab" design
function Icon({ id, color }) {
  if (id === "peroxide")
    return (
      <svg viewBox="0 0 48 64" aria-hidden="true"><rect x="17" y="2" width="14" height="9" rx="2.5" fill="#f4f4f1" stroke="#14213d" strokeWidth="2" /><path d="M14 11h20l4 7v38a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V18Z" fill="#6b3a1c" stroke="#14213d" strokeWidth="2" /><rect x="10" y="28" width="28" height="18" fill="#ffffff" stroke="#14213d" strokeWidth="2" /><rect x="10" y="28" width="28" height="5" fill="#2f5fc4" /><path d="M15 38h12M15 42h8" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" /><path d="M15 16v8" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" /></svg>
    );
  if (id === "soap")
    return (
      <svg viewBox="0 0 48 64" aria-hidden="true"><path d="M21 2h6v8h-6z" fill="#1f8f4e" stroke="#14213d" strokeWidth="2" /><path d="M16 10h16l6 9v36a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V19Z" fill="#f6d44a" stroke="#14213d" strokeWidth="2" /><rect x="10" y="30" width="28" height="16" fill="#1f8f4e" /><circle cx="31" cy="38" r="4" fill="#f6d44a" /><circle cx="18" cy="24" r="3" fill="#ffffff" fillOpacity="0.75" /><circle cx="24" cy="20" r="2" fill="#ffffff" fillOpacity="0.75" /></svg>
    );
  if (id === "dye")
    return (
      <svg viewBox="0 0 30 42" aria-hidden="true"><path d="M15 1c3 5 5 8 5 11H10c0-3 2-6 5-11Z" fill="#ffffff" stroke="#14213d" strokeWidth="1.8" /><rect x="6" y="12" width="18" height="28" rx="5" fill={color} stroke="#14213d" strokeWidth="1.8" /><path d="M10 17v8" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" /></svg>
    );
  return (
    <svg viewBox="0 0 48 64" aria-hidden="true"><path d="M8 7l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V57l-4 3-4-3-4 3-4-3-4 3-4-3-4 3-4-3Z" fill="#f2c879" stroke="#14213d" strokeWidth="2" strokeLinejoin="round" /><rect x="9" y="7" width="30" height="10" fill="#d9482b" /><rect x="13" y="25" width="22" height="20" rx="3" fill="#ffffff" stroke="#14213d" strokeWidth="1.6" /><text x="24" y="38" fontSize="7" fontWeight="800" textAnchor="middle" fill="#14213d" fontFamily="Figtree Variable, sans-serif">YEAST</text><path d="M33 4l5 4" stroke="#14213d" strokeWidth="1.4" strokeDasharray="2 2" /></svg>
  );
}

// A flat drawing of the same bench, used only if this device can't show 3D. It works the same way.
function FlatLab({ ref }) {
  const [level, setLevel] = useState(0);
  const [color, setColor] = useState("#cfe6fb");
  const [soap, setSoapOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [reacting, setReacting] = useState(false);
  const neck = useRef(null);
  useImperativeHandle(ref, () => ({
    pour: (kind, c, to) => new Promise((done) => {
      setStream(kind === "dye" ? c : kind === "soap" ? "#f2c230" : kind === "yeast" ? "#c79a5c" : "#cfe6fb");
      setTimeout(() => setLevel(to), 300);
      setTimeout(() => { setStream(null); done(); }, 1000);
    }),
    addDye: (hex) => setColor((cur) => (cur === "#cfe6fb" ? hex : cur)),
    setSoap: (on) => setSoapOn(on),
    react: () => new Promise((done) => { setReacting(true); setTimeout(done, 1300); }),
    neckPoint: () => { const r = neck.current.getBoundingClientRect(); return { x: r.left, y: r.top }; },
    pause() {}, resume() {}, dispose() {},
    reset: () => { setLevel(0); setColor("#cfe6fb"); setSoapOn(false); setReacting(false); },
  }), []);
  const flaskPath = "M84 22v62L28 214a14 14 0 0 0 13 20h118a14 14 0 0 0 13-20L116 84V22Z";
  return (
    <div className={`flat-lab ${reacting ? "is-reacting" : ""}`}>
      <div className="flat-flask">
        {stream && <div className="flat-stream" style={{ "--pour": stream }}><span /></div>}
        <svg viewBox="0 0 200 250" aria-hidden="true">
          <defs><clipPath id="flat-in"><path d={flaskPath} /></clipPath></defs>
          <path d={flaskPath} fill="rgba(226,238,252,0.5)" />
          <g clipPath="url(#flat-in)">
            <rect x="0" width="200" height="250" style={{ fill: color, transform: `translateY(${234 - level * 234}px)`, transition: "transform 0.8s ease, fill 0.6s" }} />
            {soap && [60, 82, 100, 118, 140].map((x, i) => <circle key={i} className="flat-bubble" cx={x} cy={226} r={3} style={{ animationDelay: `${i * 0.4}s` }} />)}
          </g>
          <path d={flaskPath} fill="none" stroke="#14213d" strokeWidth="4" strokeLinejoin="round" />
          {reacting && <g className="flat-puff" fill={color}><circle cx="100" cy="20" r="16" /><circle cx="88" cy="10" r="11" /><circle cx="113" cy="9" r="12" /></g>}
        </svg>
        <span className="flat-neck" ref={neck} />
      </div>
    </div>
  );
}

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export default function Experiment() {
  const [done, setDone] = useState({ peroxide: false, soap: false, yeast: false });
  const [dyes, setDyes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("build");   // build → react → erupt → full → draining → build
  const [scene3d, setScene3d] = useState("loading");
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const foamRef = useRef(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // load the 3D bench only when the section gets close
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      // use the 3D bench when the device can show it; otherwise the flat drawing does the same job
      const loadNow = (tries) =>
        import("../three/labScene.js")
          .then(({ createLabScene }) => {
            if (cancelled) return;
            sceneRef.current = createLabScene(canvas, { reducedMotion: reduced });
            setScene3d("ready");
          })
          .catch(() => {
            if (cancelled) return;
            if (tries > 0) setTimeout(() => loadNow(tries - 1), 800);
            else setScene3d("flat");
          });
      // the 3D check opens a test context, so do it when the browser is idle
      const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 100));
      idle(() => {
        if (cancelled) return;
        if (!webglOK() || isSoftwareGL()) { setScene3d("flat"); return; }
        loadNow(1);
      });
    }, { rootMargin: "500px 0px" });
    io.observe(canvas);
    return () => { cancelled = true; io.disconnect(); sceneRef.current?.dispose(); foamRef.current?.dispose(); lockScroll(false); };
  }, []);

  const current = !done.peroxide ? 0 : !done.soap ? 1 : !done.yeast ? (dyes.length ? 3 : 2) : 4;
  const levels = { peroxide: 0.46, soap: 0.53, dye: 0.55, yeast: 0.6 };

  async function add(id, dye) {
    const s = sceneRef.current;
    if (busy || phase !== "build" || !s) return;
    setBusy(true);
    if (id === "dye") {
      const next = [...dyes, dye.hex];
      await s.pour("dye", dye.hex, levels.dye + next.length * 0.01);
      s.addDye(dye.hex, next);
      setDyes(next);
    } else {
      if (id === "yeast") loadFoam();   // get the eruption ready while the yeast pours
      await s.pour(id, null, levels[id]);
      if (id === "soap") s.setSoap(true);
      setDone((d) => ({ ...d, [id]: true }));
      if (id === "yeast") { await erupt(); }
    }
    setBusy(false);
  }

  async function erupt() {
    const s = sceneRef.current;
    setPhase("react");
    await s.react(dyes);
    const { createFoam } = await loadFoam();
    setPhase("erupt");
    lockScroll(true);
    // once the foam covers the bench there's no need to keep drawing the 3D scene
    setTimeout(() => sceneRef.current?.pause(), 3200);
    foamRef.current = createFoam({
      colors: dyes,
      origin: s.neckPoint(),
      reducedMotion: reduced,
      onFull: () => setPhase("full"),
    });
  }

  function cleanUp() {
    setPhase("draining");
    foamRef.current?.drain(() => {
      foamRef.current = null;
      lockScroll(false);
      sceneRef.current?.reset();
      sceneRef.current?.resume();
      setDone({ peroxide: false, soap: false, yeast: false });
      setDyes([]);
      setPhase("build");
    });
  }

  // a check badge pops onto each ingredient as it goes in
  const shelfRef = useRef(null);
  useEffect(() => {
    const fresh = shelfRef.current?.querySelectorAll(".shelf-check:not([data-in])");
    if (!fresh?.length || reduced) return;
    fresh.forEach((el) => { el.dataset.in = "1"; });
    loadAnime().then(({ animate }) => animate(fresh, { scale: [0, 1], rotate: [-40, 0], duration: 700, ease: "outElastic(1, .55)" })).catch(() => {});
  }, [done, reduced]);
  const doneRef = useRef(null);
  useEffect(() => {
    if (phase !== "full" || !doneRef.current || reduced) return;
    const el = doneRef.current;
    loadAnime().then(({ animate }) => animate(el, { opacity: [0, 1], y: [36, 0], scale: [0.86, 1], duration: 900, ease: "outElastic(1, .7)" })).catch(() => {});
  }, [phase, reduced]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && (phase === "full" || phase === "erupt")) cleanUp(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const open = (id) =>
    phase === "build" && !busy && (scene3d === "ready" || scene3d === "flat") &&
    (id === "peroxide" ? !done.peroxide
      : id === "soap" ? done.peroxide && !done.soap
      : id === "dye" ? done.soap && !done.yeast && dyes.length < 3
      : done.soap && !done.yeast);
  const isDone = (id) => (id === "dye" ? dyes.length > 0 : done[id]);

  const status =
    phase === "react" || phase === "erupt" ? "Stand back!"
    : current === 2 ? "Step 3 of 4: Add food coloring (pick up to 3)"
    : current === 3 ? (dyes.length < 3 ? "Add another color, or step 4: add the yeast" : "Step 4 of 4: Add the yeast")
    : current < 4 ? `Step ${current + 1} of 4: ${STEPS[current].title}`
    : "";

  return (
    <section className="section lab" id="experiment">
      <div className="wrap lab-grid">
        <div className="lab-copy">
          <p className="lab-kicker" data-reveal="up">Try an experiment</p>
          <SplitWords>Make elephant toothpaste</SplitWords>
          <ol className="lab-steps" data-reveal="up" style={{ "--d": 2 }}>
            {STEPS.map((s, i) => (
              <li key={s.id} className={`${isDone(s.id) ? "is-done" : ""} ${phase === "build" && (current === i || (i === 3 && current === 3)) ? "is-next" : ""}`}>
                <span className="lab-num" aria-hidden="true">{isDone(s.id) ? "✓" : i + 1}</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ol>
          <p className="lab-safety" data-reveal="up" style={{ "--d": 3 }}>
            Trying it for real? Use 3% peroxide, wear goggles, and have an adult with you.
          </p>
        </div>

        <div data-reveal="up" style={{ "--d": 2 }}>
          <div className={`lab-bench phase-${phase} is-${scene3d}`}>
            <div className="lab-stage">
              <canvas ref={canvasRef} className="lab-canvas" aria-label="A glass flask on a lab bench" role="img" hidden={scene3d === "flat"} />
              {scene3d === "flat" && <FlatLab ref={sceneRef} />}
              <p className="lab-status" aria-live="polite">{status}</p>
            </div>

            <div className="lab-shelf" ref={shelfRef}>
              {STEPS.map((s) =>
                s.id === "dye" ? (
                  <div key={s.id} className={`shelf-item shelf-dye ${open("dye") ? "is-open" : ""} ${isDone("dye") ? "is-done" : ""}`}>
                    <span className="shelf-label">{s.short}</span>
                    <div className="dye-row">
                      {DYES.map((d) => (
                        <button
                          key={d.hex}
                          type="button"
                          className={`dye ${dyes.includes(d.hex) ? "is-in" : ""}`}
                          disabled={!open("dye") || dyes.includes(d.hex)}
                          onClick={() => add("dye", d)}
                          aria-label={`Add ${d.name.toLowerCase()} food coloring`}
                        >
                          <Icon id="dye" color={d.hex} />
                        </button>
                      ))}
                    </div>
                    <span className="shelf-amount">{dyes.length ? `${dyes.length} of 3 added` : s.amount}</span>
                  </div>
                ) : (
                  <button
                    key={s.id}
                    type="button"
                    className={`shelf-item ${open(s.id) ? "is-open" : ""} ${done[s.id] ? "is-done" : ""}`}
                    disabled={!open(s.id)}
                    onClick={() => add(s.id)}
                  >
                    {done[s.id] && <span className="shelf-check" aria-hidden="true">✓</span>}
                    <Icon id={s.id} />
                    <span className="shelf-label">{s.short}</span>
                    <span className="shelf-amount">{done[s.id] ? "Added" : s.amount}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {(phase === "full" || phase === "draining") &&
        createPortal(
          <div className={`foam-done ${phase === "draining" ? "is-leaving" : ""}`} ref={doneRef}>
            <span>That's elephant toothpaste!</span>
            <button type="button" className="btn btn-ink" onClick={cleanUp} autoFocus>Clean it up</button>
          </div>,
          document.body
        )}
    </section>
  );
}
