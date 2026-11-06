// The elephant toothpaste eruption, full screen. Real elephant toothpaste is one thick, continuous,
// striped rope of foam, so that's what this draws (no particles):
//   1. the rope shoots up out of the flask's neck to the top of the screen, stripes racing up it
//   2. it rolls out along the top of the screen and droops down in thick folds and drips
//   3. foam piles up from the bottom, highest around the flask, until the two meet and the screen is full
// anime.js runs the timeline (how far each part has got, with easing); every frame those numbers are
// turned into smooth shapes, filled with folded stripes of the dye colors, micro-bubbles and soft shading.
import { createTimeline, animate } from "animejs";

const CREAM = "#fbf7ef";

function parse(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function mixRGB(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// folded stripes, the way the colored layers of real foam pile up. Tiles seamlessly top to bottom.
function stripeTexture(colors, w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  const cream = parse(CREAM);
  // dye, cream, dye, cream… (foam is paler than the dye that colors it)
  const bands = colors.length
    ? colors.flatMap((col) => [mixRGB(parse(col), cream, 0.2), cream])
    : [cream, mixRGB(cream, [226, 216, 196], 0.6)];
  const nb = bands.length;
  const widths = bands.map((_, i) => (colors.length && i % 2 === 1 ? 1.35 : 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
  const TAU = Math.PI * 2;
  for (let y = 0; y < h; y++) {
    const yy = y / h;
    for (let x = 0; x < w; x++) {
      // one full cycle of bands per tile height, with long lazy waves across (like layers of piled foam)
      const X = x * 3;   // screen pixels, so the waves are the same size on a phone and a big monitor
      const f = total * yy + 0.3 * Math.sin(X * 0.0085 + TAU * yy) + 0.09 * Math.sin(X * 0.023 - TAU * yy + 1.7) + X * 0.00028;
      const p = ((f % total) + total) % total;
      let k = nb - 1;
      while (k > 0 && starts[k] > p) k--;
      const fr = (p - starts[k]) / widths[k];
      const A = bands[k], B = bands[(k + 1) % nb];
      // soft blend over the last stretch of each band
      const u = fr > 0.82 ? (fr - 0.82) / 0.18 : 0;
      const s = u * u * (3 - 2 * u);
      const i = (y * w + x) * 4;
      img.data[i] = A[0] + (B[0] - A[0]) * s;
      img.data[i + 1] = A[1] + (B[1] - A[1]) * s;
      img.data[i + 2] = A[2] + (B[2] - A[2]) * s;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: c, bands: bands.map((b) => `rgb(${b.join(",")})`) };
}

// heaped foam is lumpy: soft round puffs, lit from the upper left with a shadow tucked under each.
// Wraps top to bottom so it can scroll.
function lumpTexture(w, h, size) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  const n = Math.round((w * h) / (size * size) * 1.1);
  for (let i = 0; i < n; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = size * (0.5 + Math.random() * 0.7);
    for (const oy of [-h, 0, h]) {
      const sh = x.createRadialGradient(px + r * 0.12, py + r * 0.22 + oy, r * 0.55, px, py + oy, r * 1.05);
      sh.addColorStop(0, "rgba(20,33,61,0)"); sh.addColorStop(0.8, "rgba(20,33,61,0.045)"); sh.addColorStop(1, "rgba(20,33,61,0)");
      x.fillStyle = sh; x.beginPath(); x.arc(px, py + oy, r * 1.05, 0, Math.PI * 2); x.fill();
      const hi = x.createRadialGradient(px - r * 0.3, py - r * 0.35 + oy, 0, px - r * 0.2, py - r * 0.25 + oy, r * 0.7);
      hi.addColorStop(0, "rgba(255,255,255,0.26)"); hi.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = hi; x.beginPath(); x.arc(px - r * 0.2, py - r * 0.25 + oy, r * 0.7, 0, Math.PI * 2); x.fill();
    }
  }
  return c;
}

// real foam is countless tiny bubbles: a tile of micro-bubbles laid over everything
function microBubbles() {
  const c = document.createElement("canvas");
  c.width = c.height = 220;
  const x = c.getContext("2d");
  for (let i = 0; i < 240; i++) {
    const px = Math.random() * 220, py = Math.random() * 220, r = 1.2 + Math.random() * Math.random() * 6;
    x.fillStyle = "rgba(20,33,61,0.06)";
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(255,255,255,0.5)"; x.lineWidth = 0.8;
    x.beginPath(); x.arc(px, py, r, Math.PI * 1.05, Math.PI * 1.75); x.stroke();
    x.fillStyle = "rgba(255,255,255,0.65)";
    x.beginPath(); x.arc(px - r * 0.35, py - r * 0.35, Math.max(0.5, r * 0.22), 0, Math.PI * 2); x.fill();
  }
  return c;
}

export function createFoam({ colors, origin, reducedMotion, onFull }) {
  const canvas = document.createElement("canvas");
  canvas.className = "foam-layer";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1, tex = null, micro = null, microPat = null, lumps = null, ropeLumps = null;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // the stripe texture is made small and drawn 3x up, which also softens the band edges
    tex = stripeTexture(colors, Math.ceil(W / 3), Math.ceil(H / 3));
    micro = micro || microBubbles();
    lumps = lumpTexture(Math.ceil(W / 2), Math.ceil(H / 2), Math.max(40, Math.min(W, H) / 9));
    ropeLumps = ropeLumps || lumpTexture(120, 240, 26);
    microPat = ctx.createPattern(micro, "repeat");
    if (ready && !raf && !disposed) draw();
  }
  let raf = 0, disposed = false, ready = false;
  resize();
  window.addEventListener("resize", resize);

  const ox = Math.max(60, Math.min(W - 60, origin.x));
  const oy = Math.max(80, Math.min(H - 20, origin.y));
  const r0 = Math.max(18, Math.min(70, origin.r || 30));   // rope radius where it leaves the neck
  // drips along the top fold
  const nDrips = Math.max(4, Math.round(W / 220));
  const drips = Array.from({ length: nDrips }, (_, i) => ({
    x: ((i + 0.3 + Math.random() * 0.4) / nDrips) * W, w: 40 + Math.random() * 70, d: 0.4 + Math.random() * 0.9,
  }));

  // the timeline animates these
  const st = { col: 0, girth: 0, spread: 0, droop: 0, flood: 0, drain: 0, speed: 1 };
  let t = 0, last = performance.now(), full = false, flowOff = 0;
  ready = true;

  // ── shapes ──
  const step = () => Math.max(10, W / 90);
  function ropeHalf(s) {
    // thick and lumpy; lumps travel up the rope so it reads as foam pushing out
    return r0 * (1 + st.girth * 0.9) * (1 + 0.14 * Math.sin(s * 0.045 - t * 9) + 0.06 * Math.sin(s * 0.11 + t * 4));
  }
  function ropeX(s) {
    return ox + Math.sin(s * 0.006 - t * 1.7) * Math.min(36, s * 0.07);
  }
  function floodTop(x) {
    // highest around the flask, with lumpy rolling folds
    const base = H + 40 - st.flood * (H * 0.72 + 40);
    const mound = 160 * st.flood * Math.exp(-(((x - ox) / (W * 0.32)) ** 2));
    return base - mound + 16 * Math.sin(x * 0.012 + t * 1.1) + 9 * Math.sin(x * 0.033 - t * 1.7) + 5 * Math.sin(x * 0.08 + t * 2.3);
  }
  function curtainBottom(x) {
    const half = st.spread * (W * 1.15);
    const d = Math.abs(x - ox) / Math.max(1, half);
    if (d >= 1) return -40;
    const fall = Math.sqrt(1 - d ** 4);                           // a rounded front edge as it rolls out
    let y = (50 + st.droop * (H * 0.66 - 50)) * fall;
    for (const dr of drips) y += dr.d * 90 * st.droop * st.droop * Math.exp(-(((x - dr.x) / dr.w) ** 2)) * fall;
    return y + 12 * Math.sin(x * 0.017 - t * 1.3) + 6 * Math.sin(x * 0.05 + t * 2);
  }

  // ── drawing helpers ──
  function fillStripes(scroll) {
    const th = tex.canvas.height * 3;
    const off = ((scroll % th) + th) % th;
    for (let y = off - th; y < H; y += th) ctx.drawImage(tex.canvas, 0, y, W, th);
  }
  // lumps are drawn 2x up from a half-size tile; scroll moves them with the foam
  function puffs(img, scroll, x0, wDraw, scale) {
    const th = img.height * scale;
    const off = ((scroll % th) + th) % th;
    for (let y = off - th; y < H; y += th) ctx.drawImage(img, x0, y, wDraw, th);
  }
  function bubbles(drift) {
    ctx.save();
    ctx.translate(0, -(((drift % 220) + 220) % 220));
    ctx.fillStyle = microPat;
    ctx.fillRect(0, 0, W, H + 220);
    ctx.restore();
  }

  // the pile from the bottom and the fold from the top are filled as ONE shape (so where they meet
  // there's no seam); their rounded edges are only drawn where they're still open to the page
  function drawMass() {
    if (st.flood <= 0 && st.spread <= 0) return;
    const sx = step();
    const fl = [], cu = [];
    for (let x = -sx; x <= W + sx; x += sx) { fl.push([x, floodTop(x)]); cu.push([x, curtainBottom(x)]); }
    const path = new Path2D();
    if (st.flood > 0) {
      path.moveTo(-sx, H + 60);
      for (const [x, y] of fl) path.lineTo(x, y);
      path.lineTo(W + sx, H + 60); path.closePath();
    }
    if (st.spread > 0) {
      // drawn right-to-left so both parts wind the same way and fill as a union
      path.moveTo(W + sx, -60);
      for (let i = cu.length - 1; i >= 0; i--) path.lineTo(cu[i][0], cu[i][1]);
      path.lineTo(-sx, -60); path.closePath();
    }
    const open = (i) => fl[i][1] > cu[i][1] + 4;          // is there still a gap at this x?
    // soft shadows onto the page in the gap
    ctx.save(); ctx.translate(6, 12); ctx.fillStyle = "rgba(20,33,61,0.13)"; ctx.fill(path); ctx.restore();
    ctx.save();
    ctx.clip(path);
    fillStripes(-t * 16);
    puffs(lumps, -t * 16, 0, W, 2);
    bubbles(t * 12);
    // light from above, a little depth toward the bottom
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,255,255,0.16)"); g.addColorStop(0.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(20,33,61,0.14)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // rounded edges, only along the stretches that are still open
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const strokeOpen = (pts, dy, style, width) => {
      ctx.beginPath();
      let on = false;
      for (let i = 0; i < pts.length; i++) {
        if (!open(i)) { on = false; continue; }
        const [x, y] = pts[i];
        if (on) ctx.lineTo(x, y + dy); else { ctx.moveTo(x, y + dy); on = true; }
      }
      ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke();
    };
    if (st.flood > 0) strokeOpen(fl, 8, "rgba(255,255,255,0.45)", 8);         // a lip of light on the pile
    if (st.spread > 0) strokeOpen(cu, -9, "rgba(20,33,61,0.13)", 14);        // shade under the fold
    ctx.restore();
  }

  function drawRope() {
    if (st.col <= 0) return;
    const len = (oy + 120) * st.col;
    const n = 48;
    const L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const s = (len * i) / n, y = oy - s, x = ropeX(s);
      // narrower right at the neck, rounded at the head while it's still climbing
      const neck = Math.min(1, 0.72 + s / (r0 * 6));
      const head = st.col < 1 ? Math.sqrt(Math.max(0, Math.min(1, (len - s) / (r0 * 1.2)))) : 1;
      const hw = ropeHalf(s) * neck * Math.max(0.15, head);
      L.push([x - hw, y]); R.push([x + hw, y]);
    }
    const path = new Path2D();
    path.moveTo(L[0][0], L[0][1]);
    for (const p of L) path.lineTo(p[0], p[1]);
    for (let i = R.length - 1; i >= 0; i--) path.lineTo(R[i][0], R[i][1]);
    path.closePath();
    // shadow on the page
    ctx.save(); ctx.translate(7, 6); ctx.fillStyle = "rgba(20,33,61,0.1)"; ctx.fill(path); ctx.restore();
    ctx.save();
    ctx.clip(path);
    // stripes race up the rope: the same soft layered bands, squeezed to rope size and moving up
    const cycle = r0 * 3.2 * tex.bands.length;
    const ropeW = ropeHalf(0) * 4.5;
    const offR = ((-flowOff % cycle) + cycle) % cycle;
    for (let y = oy + 20 + offR - cycle; y > oy - len - cycle * 2; y -= cycle) ctx.drawImage(tex.canvas, 0, 0, tex.canvas.width * 0.15, tex.canvas.height, ox - ropeW, y, ropeW * 2, cycle);
    puffs(ropeLumps, -flowOff, ox - ropeW, ropeW * 2, (ropeW * 2) / ropeLumps.width * 1);
    bubbles(flowOff * 0.6);
    // round it: darker at the sides, a highlight left of center
    const span = ropeHalf(0) * 2.2, top = oy - len - 10;
    const g = ctx.createLinearGradient(ox - span, 0, ox + span, 0);
    g.addColorStop(0, "rgba(20,33,61,0.3)"); g.addColorStop(0.3, "rgba(255,255,255,0.28)"); g.addColorStop(0.45, "rgba(255,255,255,0.05)");
    g.addColorStop(0.8, "rgba(20,33,61,0.08)"); g.addColorStop(1, "rgba(20,33,61,0.32)");
    ctx.fillStyle = g; ctx.fillRect(ox - span, top, span * 2, oy - top + 20);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (st.drain > 0) { ctx.translate(0, st.drain * H * 1.25); ctx.globalAlpha = 1 - Math.max(0, st.drain - 0.7) / 0.3; }
    drawRope();
    drawMass();
    ctx.restore();
  }

  function loop(now) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    flowOff += dt * (r0 * 26) * st.speed;      // how fast the stripes race up the rope
    draw();
    raf = requestAnimationFrame(loop);
  }

  let tl = null;
  if (reducedMotion) {
    Object.assign(st, { col: 1, girth: 1, spread: 1, droop: 1, flood: 1 });
    draw();
    full = true;
    onFull?.();
  } else {
    tl = createTimeline({ onComplete: () => { full = true; onFull?.(); } })
      .add(st, { col: 1, duration: 700, ease: "outExpo" }, 0)                 // shoots up
      .add(st, { girth: 1, duration: 1600, ease: "outQuad" }, 150)            // and fattens
      .add(st, { spread: 1, duration: 1500, ease: "outCubic" }, 520)          // rolls out along the top
      .add(st, { droop: 1, duration: 2600, ease: "inOutSine" }, 800)          // folds droop down
      .add(st, { flood: 1, duration: 2800, ease: "inOutSine" }, 600)          // piles up from the bottom
      .add(st, { speed: 0.12, duration: 1400, ease: "outQuad" }, 2600);       // the gush slows to an ooze
    raf = requestAnimationFrame(loop);
  }

  function dispose() {
    disposed = true;
    tl?.pause();
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    canvas.remove();
  }

  return {
    // the foam slides down off the screen
    drain(done) {
      if (reducedMotion) { dispose(); done?.(); return; }
      tl?.pause();
      animate(st, { drain: 1, duration: 1100, ease: "inQuad", onComplete: () => { dispose(); done?.(); } });
    },
    dispose,
  };
}
