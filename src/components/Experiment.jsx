import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SplitWords from "../motion/SplitWords.jsx";
import { lockScroll } from "../motion/smoothScroll.js";
import { createFoam } from "../motion/foam.js";

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
  { id: "peroxide", title: "Pour in hydrogen peroxide", short: "Peroxide" },
  { id: "soap", title: "Squeeze in dish soap", short: "Dish soap" },
  { id: "dye", title: "Add food coloring", short: "Coloring" },
  { id: "yeast", title: "Add the yeast", short: "Yeast" },
];

// small shelf icons for the buttons
function Icon({ id, color }) {
  if (id === "peroxide")
    return (
      <svg viewBox="0 0 40 52" aria-hidden="true"><rect x="15" y="3" width="10" height="7" rx="2" fill="#fff" /><path d="M11 13h18a4 4 0 0 1 4 4v29a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z" fill="#6a3b1e" /><rect x="11" y="24" width="18" height="12" rx="2" fill="#fff" /><rect x="11" y="26" width="18" height="3" fill="#2f6fd1" /></svg>
    );
  if (id === "soap")
    return (
      <svg viewBox="0 0 40 52" aria-hidden="true"><path d="M17 2h6v7h-6z" fill="#22a046" /><path d="M14 9h12l4 8v28a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5V17l4-8Z" fill="#f2c230" /><circle cx="17" cy="28" r="2.5" fill="#fff" opacity=".8" /></svg>
    );
  if (id === "dye")
    return (
      <svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 2c3 5 6 8 6 12H14c0-4 3-7 6-12Z" fill="#fff" /><path d="M12 15h16a3 3 0 0 1 3 3v27a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V18a3 3 0 0 1 3-3Z" fill={color} /></svg>
    );
  return (
    <svg viewBox="0 0 40 52" aria-hidden="true"><path d="M6 14h28l-2 32a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4L6 14Z" fill="#fff" /><path d="M8 26h24l-1.5 20a3.5 3.5 0 0 1-3.5 3H13a3.5 3.5 0 0 1-3.5-3L8 26Z" fill="#caa36b" /></svg>
  );
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
      import("../three/labScene.js")
        .then(({ createLabScene }) => {
          if (cancelled) return;
          sceneRef.current = createLabScene(canvas, { reducedMotion: reduced });
          setScene3d("ready");
        })
        .catch(() => !cancelled && setScene3d("failed"));
    }, { rootMargin: "500px 0px" });
    io.observe(canvas);
    return () => { cancelled = true; io.disconnect(); sceneRef.current?.dispose(); foamRef.current?.dispose(); lockScroll(false); };
  }, []);

  const current = !done.peroxide ? 0 : !done.soap ? 1 : !done.yeast ? (dyes.length ? 3 : 2) : 4;
  const levels = { peroxide: 0.46, soap: 0.53, dye: 0.55, yeast: 0.64 };

  async function add(id, dye) {
    const s = sceneRef.current;
    if (busy || phase !== "build" || !s) return;
    setBusy(true);
    if (id === "dye") {
      const next = [...dyes, dye.hex];
      await s.pour("dye", dye.hex, levels.dye + next.length * 0.01);
      s.setColor(next[0]);
      setDyes(next);
    } else {
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
    await s.react(dyes[0]);
    setPhase("erupt");
    lockScroll(true);
    setTimeout(() => sceneRef.current?.pause(), 900);
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

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && (phase === "full" || phase === "erupt")) cleanUp(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const open = (id) =>
    phase === "build" && !busy && scene3d === "ready" &&
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
              <canvas ref={canvasRef} className="lab-canvas" aria-label="A glass flask on a lab bench" role="img" />
              {scene3d === "failed" && <p className="lab-fallback">This experiment needs a browser with 3D graphics turned on.</p>}
              <p className="lab-status" aria-live="polite">{status}</p>
            </div>

            <div className="lab-shelf">
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
                  </div>
                ) : (
                  <button
                    key={s.id}
                    type="button"
                    className={`shelf-item ${open(s.id) ? "is-open" : ""} ${done[s.id] ? "is-done" : ""}`}
                    disabled={!open(s.id)}
                    onClick={() => add(s.id)}
                  >
                    <Icon id={s.id} />
                    <span className="shelf-label">{s.short}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {(phase === "full" || phase === "draining") &&
        createPortal(
          <div className={`foam-done ${phase === "draining" ? "is-leaving" : ""}`}>
            <span>That's elephant toothpaste!</span>
            <button type="button" className="btn btn-ink" onClick={cleanUp} autoFocus>Clean it up</button>
          </div>,
          document.body
        )}
    </section>
  );
}
