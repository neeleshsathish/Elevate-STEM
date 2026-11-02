// The 3D lab bench for the elephant toothpaste experiment: a glass flask on a bench, liquid that rises
// as ingredients go in, soap bubbles, and a bottle that swings in and pours each ingredient.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const BG = "#eef3fa";
const NECK_Y = 2.24;
const BOTTOM_Y = 0.08;
const FULL_Y = 1.56;

// inside radius of the flask at height y (round base → cone → neck)
function innerR(y) {
  if (y < 0.2) return 0.9 + ((y - BOTTOM_Y) / 0.12) * 0.08;
  if (y < 1.52) return 0.98 - ((y - 0.2) / 1.32) * 0.74;
  return 0.235;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

function glossy(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, ...extra });
}

// ───────── Bottles, each built with its mouth at the origin and its body below ─────────
function makeBottle(kind, color) {
  const g = new THREE.Group();
  if (kind === "peroxide") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.86, 40), glossy("#6a3b1e", { roughness: 0.35 }));
    body.position.y = -0.62;
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.3, 0.16, 40), glossy("#6a3b1e", { roughness: 0.35 }));
    shoulder.position.y = -0.11;
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.34, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#fbfbf7", roughness: 0.6 }));
    label.position.y = -0.62;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.308, 0.308, 0.05, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#2f6fd1", roughness: 0.5 }));
    band.position.y = -0.52;
    g.add(body, shoulder, label, band);
  } else if (kind === "soap") {
    const pts = [[0, -1.05], [0.26, -1.05], [0.3, -1.0], [0.3, -0.35], [0.2, -0.16], [0.1, -0.06], [0.1, 0]].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), glossy("#f2c230", { roughness: 0.15 }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.14, 24), glossy("#22a046"));
    cap.position.y = 0.02;
    g.add(body, cap);
  } else if (kind === "dye") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 32), glossy(color, { roughness: 0.2 }));
    body.position.y = -0.34;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 32), glossy("#ffffff"));
    tip.position.y = -0.04;
    g.add(body, tip);
  } else {
    // yeast: a little glass beaker of tan, frothy yeast water
    const pts = [[0, -0.9], [0.34, -0.9], [0.36, -0.86], [0.36, 0], [0.4, 0.02], [0.33, 0.02], [0.33, -0.86], [0, -0.87]].map(([x, y]) => new THREE.Vector2(x, y));
    const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshPhysicalMaterial({ color: "#e9f2fb", roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.45 }));
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.52, 32), glossy("#caa36b", { roughness: 0.5, clearcoat: 0.3 }));
    liquid.position.y = -0.6;
    const froth = new THREE.Mesh(new THREE.CylinderGeometry(0.327, 0.327, 0.06, 32), new THREE.MeshStandardMaterial({ color: "#efe0c2", roughness: 0.9 }));
    froth.position.y = -0.31;
    g.add(glass, liquid, froth);
  }
  return g;
}

function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(20,33,61,0.38)");
  grd.addColorStop(0.55, "rgba(20,33,61,0.12)");
  grd.addColorStop(1, "rgba(20,33,61,0)");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createLabScene(canvas, { reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 4);
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xc9d6ea, 0.6));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const camBase = new THREE.Vector3(0, 2.2, 8.4);
  const look = new THREE.Vector3(0, 1.5, 0);

  // bench top and a soft shadow under the flask
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.16, 64), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 }));
  bench.position.y = -0.08;
  scene.add(bench);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  scene.add(shadow);

  // ───────── Flask: one lathe for the whole glass wall (outside up, lip, inside down) ─────────
  const wall = [
    [0, 0], [0.96, 0], [1.05, 0.05], [1.08, 0.16], [0.3, 1.46], [0.27, 1.56], [0.27, 2.14], [0.335, 2.17], [0.335, 2.24],
    [0.235, 2.24], [0.235, 1.56], [0.98, 0.2], [0.9, BOTTOM_Y], [0, BOTTOM_Y],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#ffffff", roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.12, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.3, specularIntensity: 1,
  });
  const flask = new THREE.Mesh(new THREE.LatheGeometry(wall, 96), glassMat);
  scene.add(flask);

  // ───────── Liquid ─────────
  // solid and glossy: things behind see-through glass have to be solid to show up through it
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: "#cfe6fb", roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color("#ffffff") });
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
  liquid.visible = false;
  scene.add(liquid);
  let levelNow = 0, levelTo = 0;
  function buildLiquid(level) {
    const top = BOTTOM_Y + level * (FULL_Y - BOTTOM_Y);
    const pts = [new THREE.Vector2(0, BOTTOM_Y + 0.004)];
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const y = BOTTOM_Y + 0.004 + (i / n) * (top - BOTTOM_Y - 0.004);
      pts.push(new THREE.Vector2(innerR(y) - 0.012, y));
    }
    pts.push(new THREE.Vector2(0, top));
    liquid.geometry.dispose();
    liquid.geometry = new THREE.LatheGeometry(pts, 64);
    liquid.visible = level > 0.005;
  }
  const colorNow = new THREE.Color("#d4ebff"), colorTo = new THREE.Color("#d4ebff");

  // ───────── Bubbles inside the liquid once soap is in ─────────
  const B = 46;
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.08, clearcoat: 1, emissive: "#ffffff", emissiveIntensity: 0.15 }), B);
  bubbles.count = 0;
  scene.add(bubbles);
  const bub = Array.from({ length: B }, () => ({ y: BOTTOM_Y + Math.random() * 0.6, a: Math.random() * Math.PI * 2, d: Math.random(), r: 0.02 + Math.random() * 0.035, s: 0.25 + Math.random() * 0.4 }));
  let soapy = false, fizz = 1;

  // ───────── Foam that puffs out of the neck when the yeast goes in ─────────
  const P = 22;
  const puffMat = glossy("#fbf7ef", { roughness: 0.45, clearcoat: 0.4 });
  const puffs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 16), puffMat, P);
  puffs.count = 0;
  scene.add(puffs);
  const puffSeeds = Array.from({ length: P }, (_, i) => ({ x: (Math.random() - 0.5) * 0.3, z: (Math.random() - 0.5) * 0.3, h: (i / P) * 0.9, r: 0.12 + Math.random() * 0.1 }));
  let puffT = -1;

  // ───────── Pouring ─────────
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.1, clearcoat: 1 }));
  stream.visible = false;
  scene.add(stream);
  let pourJob = null;

  // ───────── Layout & loop ─────────
  let w = 1, h = 1;
  function resize() {
    w = Math.max(1, canvas.clientWidth); h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 36 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const pointer = { x: 0, y: 0 };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const onLeave = () => { pointer.x = pointer.y = 0; };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const clock = new THREE.Clock();
  let raf = 0, visible = true, disposed = false, paused = false;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf && !disposed) loop(); });
  io.observe(canvas);

  function loop() {
    raf = 0;
    if (disposed || !visible || paused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // liquid level and color ease toward their targets
    if (Math.abs(levelTo - levelNow) > 0.0005) {
      levelNow += (levelTo - levelNow) * Math.min(1, dt * 3.2);
      buildLiquid(levelNow);
    }
    colorNow.lerp(colorTo, Math.min(1, dt * 2.5));
    liquidMat.color.copy(colorNow);

    // bubbles drift up through the liquid and pop at the surface
    const top = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);
    const nb = soapy ? Math.min(B, Math.round(18 * fizz)) : 0;
    for (let i = 0; i < nb; i++) {
      const b = bub[i];
      b.y += b.s * dt * fizz;
      if (b.y > top - 0.03) b.y = BOTTOM_Y + 0.03;
      const rr = (innerR(b.y) - 0.08) * b.d;
      v.set(Math.cos(b.a + t * 0.3) * rr, b.y, Math.sin(b.a + t * 0.3) * rr);
      s.setScalar(b.r);
      m.compose(v, q.identity(), s);
      bubbles.setMatrixAt(i, m);
    }
    bubbles.count = nb;
    bubbles.instanceMatrix.needsUpdate = true;

    // the flask trembles while reacting
    flask.position.x = liquid.position.x = bubbles.position.x = fizz > 1.5 && !reducedMotion ? Math.sin(t * 70) * 0.012 : 0;

    // foam rising out of the neck
    if (puffT >= 0) {
      puffT += dt;
      const k = clamp01(puffT / 1.3);
      for (let i = 0; i < P; i++) {
        const p = puffSeeds[i];
        const grow = clamp01(k * 1.4 - p.h * 0.6);
        v.set(p.x * (0.5 + grow), NECK_Y + p.h * grow * 0.9, p.z * (0.5 + grow));
        s.setScalar(p.r * ease(grow));
        m.compose(v, q.identity(), s);
        puffs.setMatrixAt(i, m);
      }
      puffs.count = P;
      puffs.instanceMatrix.needsUpdate = true;
    }

    if (pourJob) pourJob.step(dt);

    camera.position.set(camBase.x + pointer.x * 0.45, camBase.y - pointer.y * 0.25, camBase.z);
    camera.lookAt(look);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  buildLiquid(0);
  loop();

  // a bottle swings in, tips over the neck, pours, and swings away
  function pour(kind, color, toLevel) {
    return new Promise((resolve) => {
      const streamColor = kind === "peroxide" ? "#dcefff" : kind === "soap" ? "#f2c230" : kind === "dye" ? color : "#caa36b";
      if (reducedMotion) { levelTo = toLevel; resolve(); return; }
      const bottle = makeBottle(kind, color);
      scene.add(bottle);
      stream.material.color.set(streamColor);
      const from = new THREE.Vector3(2.8, 3.4, 0.2), at = new THREE.Vector3(0.06, NECK_Y + 0.42, 0);
      const tilt = kind === "dye" ? 2.35 : 2.05;
      let time = 0;
      pourJob = {
        step(dt) {
          time += dt;
          const tIn = ease(clamp01(time / 0.45));
          const tTip = ease(clamp01((time - 0.35) / 0.35));
          const tBack = ease(clamp01((time - 1.45) / 0.4));
          bottle.position.lerpVectors(from, at, tIn - tBack * 1);
          if (tBack > 0) bottle.position.lerpVectors(at, from, tBack);
          bottle.rotation.z = tilt * (tTip - tBack) + 0.3 * tIn;
          // the stream falls from the bottle's mouth into the neck
          const pouringNow = time > 0.62 && time < 1.42;
          stream.visible = pouringNow;
          if (pouringNow) {
            const surface = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);
            const yTop = bottle.position.y - 0.02, len = Math.max(0.1, yTop - surface);
            stream.scale.set(1, len, 1);
            stream.position.set(0.02, surface + len / 2, 0);
            if (time > 0.75) levelTo = toLevel;
          }
          if (time > 1.9) {
            stream.visible = false;
            scene.remove(bottle);
            bottle.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
            pourJob = null;
            resolve();
          }
        },
      };
    });
  }

  return {
    pour,
    setColor(hex) { colorTo.set(hex); },
    setSoap(on) { soapy = on; },
    // yeast in: bubbles race, the flask shakes, foam pushes out of the neck
    react(foamColor) {
      return new Promise((resolve) => {
        fizz = 3.2;
        puffMat.color.set(foamColor || "#fbf7ef");
        puffT = 0;
        setTimeout(resolve, reducedMotion ? 0 : 1300);
      });
    },
    neckPoint() {
      const p = new THREE.Vector3(0, NECK_Y + 0.1, 0).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (p.x * 0.5 + 0.5) * r.width, y: r.top + (-p.y * 0.5 + 0.5) * r.height };
    },
    // stop drawing while the foam covers the screen, so the foam stays smooth
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    resume() { paused = false; clock.getDelta(); if (!raf) loop(); },
    reset() {
      levelTo = 0; soapy = false; fizz = 1; puffT = -1; puffs.count = 0;
      colorTo.set("#d4ebff");
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => { o.geometry?.dispose(); const mm = o.material; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => { x.map?.dispose(); x.dispose(); }); });
      env.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
