// The footer's heap of mini Elevate STEM logos. Each one is a small glossy 3D tile (the same style as
// the logo tile on the Team page). They tumble in when the footer comes into view, settle into a pile,
// and scatter away from the mouse (or a tap). matter-js does the 2D physics; three.js draws the tiles.
import Matter from "matter-js";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const { Engine, Bodies, Body, Composite } = Matter;
const MAX = 240;

function roundedRect(size, r) {
  const s = new THREE.Shape();
  const x = -size / 2, y = -size / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + size - r, y); s.quadraticCurveTo(x + size, y, x + size, y + r);
  s.lineTo(x + size, y + size - r); s.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
  s.lineTo(x + r, y + size); s.quadraticCurveTo(x, y + size, x, y + size - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// The canvas covers the whole footer so the logos rain down from its top edge (behind the text);
// pileHeight() is how tall the heap at the bottom should get, and events come from the footer itself.
export function createLogoPile(canvas, { src, reducedMotion, pileHeight = () => canvas.clientHeight, eventTarget = canvas }) {
  let disposed = false, raf = 0;
  let w = 0, h = 0;
  let started = false, visible = false;
  let queue = 0, nextDrop = 0;
  let engine = null, bodies = [], pileH = 300;
  const pointer = { x: -9999, y: -9999, active: false };

  // ───────── 3D setup ─────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.add(new THREE.HemisphereLight(0xdff0ff, 0x223355, 0.7));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
  sun.position.set(-0.4, 1, 1.2);
  scene.add(sun);
  // pixel-sized orthographic camera: 1 unit = 1 CSS pixel, y pointing up
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -500, 500);

  // one tile 1 unit across; every logo is an instance of it, scaled to its size
  const R = 0.24, DEPTH = 0.2, BEVEL = 0.05;
  const tileGeo = new THREE.ExtrudeGeometry(roundedRect(1 - BEVEL * 2, R - BEVEL), {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 4, curveSegments: 12,
  }).center();
  const sideMat = new THREE.MeshPhysicalMaterial({ color: "#2c9468", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
  const faceGeo = new THREE.ShapeGeometry(roundedRect(1, R), 12);
  const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + 0.5, pos.getY(i) + 0.5);
  faceGeo.translate(0, 0, DEPTH / 2 + BEVEL + 0.002);
  const tex = new THREE.TextureLoader().load(src, () => { textureReady = true; maybeStart(); });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // the face keeps the logo's true colors (same finish as the Team page tile); the glossy sides carry the shine
  const faceMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  let textureReady = false;

  const tiles = new THREE.InstancedMesh(tileGeo, sideMat, MAX);
  const faces = new THREE.InstancedMesh(faceGeo, faceMat, MAX);
  // per-tile brightness: tiles still falling behind the text are dimmed so the links stay readable
  const tint = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3).fill(1), 3);
  tiles.instanceColor = tint;
  faces.instanceColor = tint;
  tiles.count = faces.count = 0;
  tiles.frustumCulled = faces.frustumCulled = false;
  scene.add(tiles, faces);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();

  // ───────── Physics ─────────
  function sizes() {
    const small = w < 640;
    const min = small ? 30 : 42, max = small ? 48 : 72;
    const avg = (min + max) / 2;
    const ph = Math.min(h, pileHeight());
    pileH = ph;
    const count = Math.round(((w * ph) / (avg * avg)) * 0.6);
    return { min, max, count: Math.min(count, small ? 80 : MAX) };
  }

  function build() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { y: 1.1 }, enableSleeping: true });
    engine.positionIterations = 8;
    const t = 120;
    Composite.add(engine.world, [
      Bodies.rectangle(w / 2, h + t / 2, w * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, -h / 2, t, h * 4, { isStatic: true }),
      Bodies.rectangle(w + t / 2, -h / 2, t, h * 4, { isStatic: true }),
    ]);
    bodies = [];
    queue = sizes().count;
    nextDrop = 0;
  }

  function drop(n) {
    const { min, max } = sizes();
    for (let i = 0; i < n && queue > 0; i++, queue--) {
      const s = min + Math.random() * (max - min);
      const b = Bodies.rectangle(s / 2 + Math.random() * (w - s), -s - Math.random() * 60, s, s, {
        chamfer: { radius: s * R }, restitution: 0.25, friction: 0.35, frictionAir: 0.012, density: 0.0015,
        angle: Math.random() * Math.PI * 2,
      });
      // each tile leans a little toward or away from you, so you can see its thickness
      b.plugin.tile = { s, tx: (Math.random() - 0.5) * 0.9, ty: (Math.random() - 0.5) * 0.9, z: bodies.length * 0.02 };
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
      bodies.push(b);
      Composite.add(engine.world, b);
    }
  }

  function draw() {
    const n = Math.min(bodies.length, MAX);
    for (let i = 0; i < n; i++) {
      const b = bodies[i], t = b.plugin.tile;
      // a tile bobbing along tilts more while it's moving, then settles back to its own lean
      const spin = Math.max(-0.5, Math.min(0.5, b.angularVelocity * 3));
      e.set(t.tx + spin, t.ty - spin, -b.angle);
      q.setFromEuler(e);
      v.set(b.position.x, -b.position.y, t.z);
      sc.set(t.s, t.s, t.s);
      m4.compose(v, q, sc);
      tiles.setMatrixAt(i, m4);
      faces.setMatrixAt(i, m4);
      // full brightness once a tile reaches the pile area; dimmer the higher up it is
      const k = Math.max(0, Math.min(1, (b.position.y - (h - pileH - 140)) / 140));
      const lum = 0.28 + 0.72 * k;
      tint.setXYZ(i, lum, lum, lum);
    }
    tint.needsUpdate = true;
    tiles.count = faces.count = n;
    tiles.instanceMatrix.needsUpdate = faces.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function push() {
    if (!pointer.active) return;
    const RAD = Math.min(170, w * 0.22);
    for (const b of bodies) {
      const dx = b.position.x - pointer.x, dy = b.position.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d > RAD || d < 1) continue;
      const f = (1 - d / RAD) * 0.007 * b.mass;
      if (b.isSleeping) Matter.Sleeping.set(b, false);
      Body.applyForce(b, b.position, { x: (dx / d) * f, y: (dy / d) * f - f * 0.6 });
    }
  }

  let last = 0, drawnStill = false;
  function loop(now) {
    raf = 0;
    if (disposed || !visible) return;
    const dt = Math.min(now - (last || now), 32) || 16.6;
    last = now;
    if (queue > 0 && now >= nextDrop) { drop(w < 640 ? 1 : 2); nextDrop = now + (w < 640 ? 70 : 40); }
    push();
    Engine.update(engine, dt);
    // once the pile has settled and nobody is touching it, skip drawing (the picture doesn't change)
    const still = queue === 0 && !pointer.active && bodies.every((b) => b.isSleeping);
    if (!still || !drawnStill) { draw(); drawnStill = still; }
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    const changed = Math.abs(nw - w) > 40 || Math.abs(nh - h) > 40;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = -h;
    camera.updateProjectionMatrix();
    if (started && changed) begin(true);
    else if (started) draw();
  }

  // reduced motion: work out where the pile settles, then draw it once without animating
  function settleStatic() {
    while (queue > 0) drop(queue);
    for (let i = 0; i < 600; i++) Engine.update(engine, 16.6);
    for (const b of bodies) Body.setAngularVelocity(b, 0);
    draw();
  }

  function begin(rebuild = false) {
    if (started && !rebuild) return;
    started = true;
    build();
    if (reducedMotion) { settleStatic(); return; }
    if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  }
  function maybeStart() { if (visible && textureReady && w) begin(); }

  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (!visible) return;
    if (!started) maybeStart();
    else if (!reducedMotion && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  }, { rootMargin: "0px 0px -25% 0px" });
  io.observe(canvas);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const toLocal = (ev) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ev.clientX - r.left; pointer.y = ev.clientY - r.top;
  };
  const onMove = (ev) => { toLocal(ev); pointer.active = true; };
  const onLeave = () => { pointer.active = false; };
  const onDown = (ev) => {
    toLocal(ev);
    // a tap or click pops the logos under it upward
    for (const b of bodies) {
      const dx = b.position.x - pointer.x, dy = b.position.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 140) {
        if (b.isSleeping) Matter.Sleeping.set(b, false);
        Body.setVelocity(b, { x: b.velocity.x + (dx / (d || 1)) * 6, y: b.velocity.y - (1 - d / 140) * 14 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
      }
    }
  };
  const onDownMaybe = (ev) => { if (!ev.target.closest("a, button")) onDown(ev); };
  if (!reducedMotion) {
    eventTarget.addEventListener("pointermove", onMove);
    eventTarget.addEventListener("pointerleave", onLeave);
    eventTarget.addEventListener("pointerdown", onDownMaybe);
  }

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      eventTarget.removeEventListener("pointermove", onMove);
      eventTarget.removeEventListener("pointerleave", onLeave);
      eventTarget.removeEventListener("pointerdown", onDownMaybe);
      if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
      tileGeo.dispose(); faceGeo.dispose(); sideMat.dispose(); faceMat.dispose(); tex.dispose();
      tiles.dispose(); faces.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
