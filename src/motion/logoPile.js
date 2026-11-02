// The footer's pile of mini Elevate STEM logos. They tumble in when the footer comes into view,
// settle into a heap, and scatter away from the mouse (or a tap). Uses matter-js for the physics.
import Matter from "matter-js";

const { Engine, Bodies, Body, Composite } = Matter;

// One logo drawn as a little rounded sticker (white edge + soft shadow), reused for every body.
function makeSprite(img, px) {
  const pad = Math.round(px * 0.14);
  const c = document.createElement("canvas");
  c.width = c.height = px + pad * 2;
  const ctx = c.getContext("2d");
  const r = px * 0.24;
  const rr = (x, y, s, rad) => {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + s, y, x + s, y + s, rad);
    ctx.arcTo(x + s, y + s, x, y + s, rad);
    ctx.arcTo(x, y + s, x, y, rad);
    ctx.arcTo(x, y, x + s, y, rad);
    ctx.closePath();
  };
  ctx.save();
  ctx.shadowColor = "rgba(20, 33, 61, 0.28)";
  ctx.shadowBlur = pad * 0.9;
  ctx.shadowOffsetY = pad * 0.25;
  rr(pad, pad, px, r);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  const inset = px * 0.07;
  ctx.save();
  rr(pad + inset, pad + inset, px - inset * 2, r * 0.8);
  ctx.clip();
  ctx.drawImage(img, pad + inset, pad + inset, px - inset * 2, px - inset * 2);
  ctx.restore();
  return { canvas: c, pad };
}

export function createLogoPile(canvas, { src, reducedMotion }) {
  let disposed = false;
  let raf = 0;
  let engine = null;
  let bodies = [];
  let sprite = null;
  let w = 0, h = 0, dpr = 1;
  let started = false, visible = false;
  let queue = 0, nextDrop = 0;
  const pointer = { x: -9999, y: -9999, active: false };
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.decoding = "async";
  img.src = src;

  function sizes() {
    const small = w < 640;
    const min = small ? 30 : 42, max = small ? 46 : 70;
    const avg = (min + max) / 2;
    // fill roughly the bottom half of the strip
    const count = Math.round(((w * h) / (avg * avg)) * (small ? 0.5 : 0.55));
    return { min, max, count: Math.min(count, small ? 90 : 220) };
  }

  function build() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { y: 1.1 } });
    engine.positionIterations = 8;
    const t = 120;
    Composite.add(engine.world, [
      Bodies.rectangle(w / 2, h + t / 2, w * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, h / 2 - h, t, h * 4, { isStatic: true }),
      Bodies.rectangle(w + t / 2, h / 2 - h, t, h * 4, { isStatic: true }),
    ]);
    bodies = [];
    const { count } = sizes();
    queue = count;
    nextDrop = 0;
    sprite = makeSprite(img, 128);
  }

  function drop(n) {
    const { min, max } = sizes();
    for (let i = 0; i < n && queue > 0; i++, queue--) {
      const s = min + Math.random() * (max - min);
      const b = Bodies.rectangle(
        s / 2 + Math.random() * (w - s),
        -s - Math.random() * 160,
        s, s,
        { chamfer: { radius: s * 0.24 }, restitution: 0.25, friction: 0.35, frictionAir: 0.012, density: 0.0015, angle: Math.random() * Math.PI * 2 }
      );
      b.plugin.size = s;
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
      bodies.push(b);
      Composite.add(engine.world, b);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const sc = sprite.canvas, full = sc.width, inner = full - sprite.pad * 2;
    for (const b of bodies) {
      const s = b.plugin.size;
      const k = s / inner;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.drawImage(sc, (-full * k) / 2, (-full * k) / 2, full * k, full * k);
      ctx.restore();
    }
  }

  // the mouse (or a finger) shoves nearby logos away from it
  function push() {
    if (!pointer.active) return;
    const R = Math.min(170, w * 0.22);
    for (const b of bodies) {
      const dx = b.position.x - pointer.x, dy = b.position.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d > R || d < 1) continue;
      const f = (1 - d / R) * 0.007 * b.mass;
      Body.applyForce(b, b.position, { x: (dx / d) * f, y: (dy / d) * f - f * 0.6 });
    }
  }

  let last = 0;
  function loop(now) {
    raf = 0;
    if (disposed || !visible) return;
    const dt = Math.min(now - (last || now), 32) || 16.6;
    last = now;
    if (queue > 0 && now >= nextDrop) { drop(w < 640 ? 2 : 4); nextDrop = now + 45; }
    push();
    Engine.update(engine, dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    const changed = Math.abs(nw - w) > 40 || Math.abs(nh - h) > 40;
    w = nw; h = nh;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (started && changed) start(true);
    else if (started) draw();
  }

  // reduced motion: work out where the pile settles, then draw it once without animating
  function settleStatic() {
    while (queue > 0) drop(queue);
    for (let i = 0; i < 600; i++) Engine.update(engine, 16.6);
    draw();
  }

  function start(rebuild = false) {
    if (!img.complete || !img.naturalWidth) { img.onload = () => start(rebuild); return; }
    if (started && !rebuild) return;
    started = true;
    build();
    if (reducedMotion) { settleStatic(); return; }
    if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  }

  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) {
      if (!started) start();
      else if (!reducedMotion && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }
  }, { rootMargin: "0px 0px -15% 0px" });
  io.observe(canvas);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  };
  const onMove = (e) => { toLocal(e); pointer.active = true; };
  const onLeave = () => { pointer.active = false; };
  const onDown = (e) => {
    toLocal(e);
    // a tap or click pops the logos under it upward
    for (const b of bodies) {
      const dx = b.position.x - pointer.x, dy = b.position.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 140) Body.setVelocity(b, { x: b.velocity.x + (dx / (d || 1)) * 6, y: b.velocity.y - (1 - d / 140) * 14 });
    }
    if (reducedMotion) { for (let i = 0; i < 240; i++) Engine.update(engine, 16.6); draw(); }
  };
  if (!reducedMotion) {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
  }

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    },
  };
}
