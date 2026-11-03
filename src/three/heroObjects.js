// Floating 3D objects for the top of each page, in the same glossy style as the homepage atom.
//   guides   → three real guide pages drifting in the air
//   team     → the Elevate STEM logo mark
//   partners → three linked rings
//   sponsors → a star
//   donate   → a heart
//   atom     → a small atom (404 page)
// Each one bobs, follows the mouse a little, spins when dragged, and has little "electrons" orbiting it.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const LOGO_URL = `${import.meta.env.BASE_URL}brand/logo-512.png`;

const C = {
  // brand: blue #36549d → teal #338f68 → green #33cc34, cream #f7e7d8
  green: "#22b52a", blue: "#3e62b4", teal: "#2c9468", cream: "#f7e7d8",
  ink: "#14213d", white: "#ffffff",
};

const glossy = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, ...extra });

const extrude = (shape, depth, bevel = 0.08) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 32 }).center();

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function starShape(points = 5, outer = 1.15, inner = 0.52) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  return s;
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -1.05);
  s.bezierCurveTo(-0.35, -0.7, -1.25, -0.25, -1.2, 0.35);
  s.bezierCurveTo(-1.15, 0.95, -0.4, 1.15, 0, 0.6);
  s.bezierCurveTo(0.4, 1.15, 1.15, 0.95, 1.2, 0.35);
  s.bezierCurveTo(1.25, -0.25, 0.35, -0.7, 0, -1.05);
  return s;
}

// ───────── Builders: each returns a THREE.Group sized about 2.6 units across ─────────
const BUILD = {
  team(renderer) {
    // The real logo on the front of a rounded tile, like an app icon floating in the sky
    const g = new THREE.Group();
    const tex = new THREE.TextureLoader().load(LOGO_URL);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const side = glossy(C.teal, { roughness: 0.3 });
    const tile = new THREE.Mesh(extrude(roundedRect(2, 2, 0.46), 0.34, 0.08), side);
    g.add(tile);
    const face = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedRect(2.02, 2.02, 0.47), 24),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, envMapIntensity: 0.35, toneMapped: false })
    );
    // map the logo across the face: ShapeGeometry UVs are in shape units, so remap to 0..1
    const uv = face.geometry.attributes.uv, pos = face.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 1.01) / 2.02, (pos.getY(i) + 1.01) / 2.02);
    face.position.z = 0.262;
    g.add(face);
    const back = face.clone();
    back.rotation.y = Math.PI; back.position.z = -0.262;
    g.add(back);
    return g;
  },
  partners() {
    const g = new THREE.Group();
    const geo = new THREE.TorusGeometry(0.72, 0.17, 32, 96);
    const a = new THREE.Mesh(geo, glossy(C.blue)); a.position.x = -0.95;
    const b = new THREE.Mesh(geo, glossy(C.teal)); b.rotation.x = Math.PI / 2;
    const c = new THREE.Mesh(geo, glossy(C.green)); c.position.x = 0.95;
    g.add(a, b, c);
    g.rotation.z = 0.25;
    return g;
  },
  sponsors() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(extrude(starShape(), 0.36, 0.12), glossy(C.green)));
    return g;
  },
  donate() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(extrude(heartShape(), 0.5, 0.16), glossy(C.green)));
    return g;
  },
  atom() {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.36, 40, 28);
    const cols = [C.green, C.blue, C.cream, C.teal];
    for (let i = 0; i < 11; i++) {
      const y = 1 - (i / 10) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      const m = new THREE.Mesh(geo, glossy(cols[i % 4]));
      m.position.set(Math.cos(th) * r * 0.45, y * 0.45, Math.sin(th) * r * 0.45);
      g.add(m);
    }
    return g;
  },
  guides(renderer, covers = []) {
    const g = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const W = 1.62, H = 2.1;
    const layout = [
      { x: -1.15, y: 0.15, z: -0.35, ry: 0.42, rz: 0.1 },
      { x: 0.0, y: 0.0, z: 0.3, ry: 0, rz: -0.04 },
      { x: 1.15, y: 0.2, z: -0.35, ry: -0.42, rz: -0.1 },
    ];
    covers.slice(0, 3).forEach((src, i) => {
      const geo = new THREE.PlaneGeometry(W, H, 24, 1);
      // a gentle curl, like paper
      const pos = geo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        pos.setZ(v, -0.12 * (x / (W / 2)) ** 2);
      }
      geo.computeVertexNormals();
      const tex = loader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, toneMapped: false }));
      const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#eef3fa", roughness: 0.8, side: THREE.BackSide }));
      const sheet = new THREE.Group();
      sheet.add(front, back);
      const L = layout[i];
      sheet.position.set(L.x, L.y, L.z);
      sheet.rotation.set(0, L.ry, L.rz);
      sheet.userData.bob = { base: L.y, phase: i * 1.7 };
      g.add(sheet);
    });
    g.userData.sheets = true;
    return g;
  },
};

export async function createHeroObject(canvas, { variant = "atom", covers = [], reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.add(new THREE.HemisphereLight(0xe6f3ff, 0x8fb6d8, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
  sun.position.set(4, 6, 6);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 8.2);

  const root = new THREE.Group();   // bob + mouse tilt
  const spin = new THREE.Group();   // drag / auto spin
  scene.add(root);
  root.add(spin);
  const obj = (BUILD[variant] || BUILD.atom)(renderer, covers);
  spin.add(obj);

  // little electrons on tilted orbits around the object
  const orbitCols = [C.green, C.blue, C.cream];
  const eGeo = new THREE.SphereGeometry(0.09, 20, 14);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const orbits = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    g.rotation.set(Math.PI / 2.3 + i * 0.35, i * 0.9, i * 1.1);
    const R = 1.9 + i * 0.12;
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.008, 6, 160), ringMat));
    const e = new THREE.Mesh(eGeo, glossy(orbitCols[i], { emissive: orbitCols[i], emissiveIntensity: 0.25 }));
    g.add(e);
    root.add(g);
    return { e, R, speed: 0.7 + i * 0.3, phase: i * 2 };
  });
  if (variant === "guides") orbits.forEach((o) => (o.R += 0.35));

  // layout
  let narrow = false;
  function resize() {
    // layout size, not the on-screen size, so the intro scale animation doesn't shrink the buffer
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w / h < 1;
    camera.position.z = narrow ? 9.6 : 8.2;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // interaction
  const pointer = { x: 0, y: 0 };
  let spinY = 0, vel = 0, dragging = false, lastX = 0, pop = 0;
  const onWinMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      spinY += dx * 0.008;
      vel = dx * 0.008 * 60;
    }
  };
  const onDown = (e) => { dragging = true; lastX = e.clientX; pop = 1; };
  const onUp = () => { dragging = false; };
  let lastScroll = window.scrollY;
  const onScroll = () => { const d = window.scrollY - lastScroll; lastScroll = window.scrollY; if (!reducedMotion) vel += d * 0.02; };
  window.addEventListener("pointermove", onWinMove, { passive: true });
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("scroll", onScroll, { passive: true });

  const clock = new THREE.Clock();
  let raf = 0, running = true, visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && running && !raf) { clock.getDelta(); loop(); } });
  io.observe(canvas);
  const autoSpin = reducedMotion ? 0 : variant === "guides" ? 0 : 0.35;

  function loop() {
    raf = 0;
    if (!running || !visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const m = reducedMotion ? 0 : 1;

    if (!dragging) { spinY += (vel + autoSpin) * dt; vel *= Math.pow(0.05, dt); }
    if (variant === "guides") {
      // the pages sway rather than spin all the way round
      spin.rotation.y = Math.sin(t * 0.3) * 0.25 * m + spinY * 0.6;
      obj.children.forEach((s) => { const b = s.userData.bob; if (b) s.position.y = b.base + Math.sin(t * 0.9 + b.phase) * 0.08 * m; });
    } else {
      spin.rotation.y = spinY;
    }

    root.position.y = Math.sin(t * 0.8) * 0.12 * m;
    root.rotation.x += ((pointer.y * 0.25 + Math.sin(t * 0.5) * 0.05 * m) - root.rotation.x) * 0.05;
    root.rotation.z += ((-pointer.x * 0.12) - root.rotation.z) * 0.05;
    pop *= Math.pow(0.02, dt);
    const s = 1 + Math.sin(pop * Math.PI) * 0.06;
    obj.scale.setScalar((variant === "team" ? 1.05 : 1) * s);

    orbits.forEach((o) => {
      const a = o.phase + t * o.speed * (reducedMotion ? 0.15 : 1);
      o.e.position.set(Math.cos(a) * o.R, Math.sin(a) * o.R, 0);
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  const onVis = () => { if (!document.hidden && !raf) { clock.getDelta(); loop(); } };
  document.addEventListener("visibilitychange", onVis);
  loop();

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("pointerdown", onDown);
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((mm) => { mm.map?.dispose(); mm.dispose(); });
      });
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
