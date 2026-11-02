// The elephant toothpaste eruption: a full-screen layer of foam that gushes out of the flask's neck,
// splashes against the top of the screen, and piles up until it fills the whole window.
// The foam is a few hundred soft blobs that push each other apart (a very simple fluid), each one
// growing a little as it ages, the way real foam keeps expanding. Colors come out in stripes, in the
// order the dyes went in.

const FOAM_WHITE = "#fbf7ef";

// a soft foam blob in one color: creamy center, slightly deeper rim, a few tiny bubbles, soft edge
function makeSprite(color, px = 96) {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d");
  const r = px / 2;
  // soft all the way out, so neighbouring blobs melt into one creamy mass instead of looking like balls
  const g = ctx.createRadialGradient(r * 0.8, r * 0.72, 0, r, r, r);
  g.addColorStop(0, mix(color, "#ffffff", 0.42));
  g.addColorStop(0.45, mix(color, "#ffffff", 0.14));
  g.addColorStop(0.7, hexA(color, 0.92));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.fill();
  // a few tiny bubbles on the surface
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = px * 0.012;
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.4, br = px * (0.02 + Math.random() * 0.03);
    ctx.beginPath(); ctx.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, br, 0, Math.PI * 2); ctx.stroke();
  }
  return c;
}

function parse(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function mix(a, b, t) {
  const A = parse(a), B = parse(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function hexA(hex, a) {
  return `rgba(${parse(hex).join(",")},${a})`;
}

export function createFoam({ colors, origin, reducedMotion, onFull }) {
  const canvas = document.createElement("canvas");
  canvas.className = "foam-layer";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  // foam colors: each dye becomes a stripe, with creamy white foam between the stripes
  const palette = (colors.length ? colors : []).map((c) => mix(c, FOAM_WHITE, 0.12));
  const stripes = palette.length ? palette.flatMap((c) => [c, c, mix(c, FOAM_WHITE, 0.45)]) : [FOAM_WHITE, "#f1ece0"];
  const sprites = new Map();
  const spriteFor = (col) => {
    if (!sprites.has(col)) sprites.set(col, makeSprite(col));
    return sprites.get(col);
  };

  const small = W < 640;
  const R = small ? 22 : 32;                  // a blob's full-grown radius
  const N = Math.min(small ? 520 : 1100, Math.round((1.1 * W * H) / (Math.PI * (R * 0.72) ** 2)));
  const ox = Math.max(40, Math.min(W - 40, origin.x));
  const oy = Math.max(60, Math.min(H - 20, origin.y));
  const scale = Math.max(0.7, H / 900);

  const ps = [];
  let emitted = 0, t0 = performance.now(), raf = 0, draining = false, full = false, disposed = false;
  let doneAt = 0, settleFrames = 0;
  let swell = 1;   // after the gush, the foam keeps expanding until it reaches the top of the screen
  const pointer = { x: -9999, y: -9999, on: false };

  function emit(now) {
    const age = (now - t0) / 1000;
    // a big gush first, then a strong steady flow; about 2.5 seconds of foam on any screen size
    const base = Math.max(2, N / 150);
    const rate = Math.round(age < 0.6 ? base * 1.6 : base);
    for (let i = 0; i < rate && emitted < N; i++, emitted++) {
      // each dye comes out as its own band; the colors cycle twice over the whole eruption
      const band = Math.floor((emitted / N) * stripes.length * 2) % stripes.length;
      ps.push({
        x: ox + (Math.random() - 0.5) * 14,
        y: oy,
        vx: (Math.random() - 0.5) * (age < 0.6 ? 3 : 7),
        vy: -(14 + Math.random() * 9) * scale * (age < 0.6 ? 1.15 : 1),
        r: R * 0.45,
        grow: R * (0.85 + Math.random() * 0.3),
        col: stripes[band],
        born: now,
      });
    }
  }

  // simple fluid: blobs push apart when they overlap and share a bit of each other's speed
  function relax() {
    // the grid cell has to be at least as big as the widest possible overlap, which grows as the foam swells
    let maxR = 1;
    for (const p of ps) if (p.r > maxR) maxR = p.r;
    const cell = maxR * 2 * 0.72 + 1;
    const grid = new Map();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const k = ((p.x / cell) | 0) * 4096 + (((p.y / cell) | 0) + 2048);
      let arr = grid.get(k);
      if (!arr) grid.set(k, (arr = []));
      arr.push(i);
    }
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const cx = (p.x / cell) | 0, cy = (p.y / cell) | 0;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const arr = grid.get(gx * 4096 + (gy + 2048));
          if (!arr) continue;
          for (const j of arr) {
            if (j <= i) continue;
            const q = ps[j];
            const dx = q.x - p.x, dy = q.y - p.y;
            const min = (p.r + q.r) * 0.72;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2), push = ((min - d) / d) * 0.5;
            p.x -= dx * push; p.y -= dy * push;
            q.x += dx * push; q.y += dy * push;
            const vx = (p.vx + q.vx) / 2, vy = (p.vy + q.vy) / 2;
            p.vx += (vx - p.vx) * 0.12; p.vy += (vy - p.vy) * 0.12;
            q.vx += (vx - q.vx) * 0.12; q.vy += (vy - q.vy) * 0.12;
          }
        }
      }
    }
  }

  function step(now) {
    if (!draining) emit(now);
    const g = 0.42 * scale;
    for (const p of ps) {
      p.vy += g;
      p.vx *= 0.985; p.vy *= 0.985;
      if (pointer.on) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 1) { const f = (1 - d / 120) * 2.2; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      }
      p.x += p.vx; p.y += p.vy;
      const target = p.grow * swell;
      if (p.r < target) p.r += (target - p.r) * 0.03;
      if (draining) { p.r *= 0.992; continue; }
      if (p.x < p.r * 0.5) { p.x = p.r * 0.5; p.vx *= -0.3; }
      if (p.x > W - p.r * 0.5) { p.x = W - p.r * 0.5; p.vx *= -0.3; }
      if (p.y > H - p.r * 0.4) { p.y = H - p.r * 0.4; p.vy *= -0.15; p.vx *= 0.9; }
      if (p.y < p.r * 0.2) { p.y = p.r * 0.2; p.vy *= -0.2; }
    }
    if (!draining) { relax(); relax(); relax(); }
  }

  // how much of the screen is covered: check a grid of points and see how many sit inside a blob
  function coverage() {
    const cols = 14, rows = Math.max(10, Math.round((14 * H) / W));
    const cw = W / cols, ch = H / rows;
    const hit = new Uint8Array(cols * rows);
    for (const p of ps) {
      const rr = p.r * 0.95;
      const x0 = Math.max(0, Math.floor((p.x - rr) / cw)), x1 = Math.min(cols - 1, Math.floor((p.x + rr) / cw));
      const y0 = Math.max(0, Math.floor((p.y - rr) / ch)), y1 = Math.min(rows - 1, Math.floor((p.y + rr) / ch));
      for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
        const dx = (gx + 0.5) * cw - p.x, dy = (gy + 0.5) * ch - p.y;
        if (dx * dx + dy * dy <= rr * rr) hit[gy * cols + gx] = 1;
      }
    }
    let n = 0;
    for (const v of hit) n += v;
    return n / hit.length;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      const s = p.r * 2.2;
      ctx.drawImage(spriteFor(p.col), p.x - s / 2, p.y - s / 2, s, s);
    }
  }

  function loop(now) {
    raf = 0;
    if (disposed) return;
    step(now);
    draw();
    if (!full && !draining && emitted >= N) {
      if (!doneAt) doneAt = now;
      const cov = coverage();
      if (cov < 0.99) swell = Math.min(2.6, swell + 0.006);
      // full once the screen is covered and the gush has had a moment to settle
      settleFrames++;
      // full once the screen is covered and the gush has settled a moment (or after ~10s of frames as a backstop)
      if ((cov >= 0.99 && settleFrames > 40) || settleFrames > 600) { full = true; onFull?.(); }
    }
    if (draining && ps.every((p) => p.y - p.r > H || p.r < 2)) { dispose(); drainDone?.(); return; }
    raf = requestAnimationFrame(loop);
  }

  // reduced motion: no gush, the screen is simply full of foam
  function fillStatic() {
    const cols = Math.ceil(W / (R * 1.3)), rows = Math.ceil(H / (R * 1.3)) + 1;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const band = Math.floor((y / rows) * stripes.length);
      ps.push({ x: x * R * 1.3 + (y % 2) * R * 0.65, y: H - y * R * 1.3, vx: 0, vy: 0, r: R, grow: R, col: stripes[stripes.length - 1 - band] });
    }
    emitted = N; full = true;
    draw();
    onFull?.();
  }

  const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; };
  const onLeave = () => { pointer.on = false; };
  if (!reducedMotion) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
  }

  if (reducedMotion) fillStatic();
  else raf = requestAnimationFrame(loop);

  let drainDone = null;
  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    canvas.remove();
  }

  return {
    // the foam slides down off the screen and pops away
    drain(done) {
      drainDone = done;
      if (reducedMotion) { dispose(); done?.(); return; }
      draining = true;
      for (const p of ps) { p.vy = Math.random() * 2; p.vx *= 0.3; }
      if (!raf) raf = requestAnimationFrame(loop);
    },
    dispose,
  };
}
