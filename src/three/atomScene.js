// The homepage 3D scene: a glossy atom floating in a cloudy sky, with a ring of curved cards
// around it. Each card is a place on the site: drag to spin the ring, click a card to open it.
import * as THREE from "three";
import { adaptiveQuality } from "./quality.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const INK = "#14213d";
const DISPLAY = '"Bricolage Grotesque Variable", "Avenir Next", system-ui, sans-serif';
const BODY = '"Figtree Variable", system-ui, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Little line drawings on the right side of each card
const DOODLES = {
  guides(ctx) {
    for (let k = 2; k >= 0; k--) {
      ctx.save();
      ctx.translate(k * 18, -k * 14);
      ctx.rotate((k - 1) * 0.08);
      roundRect(ctx, -70, -90, 140, 180, 10);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
      for (let l = 0; l < 5; l++) {
        ctx.beginPath(); ctx.moveTo(-46, -50 + l * 26); ctx.lineTo(l === 4 ? 10 : 46, -50 + l * 26); ctx.stroke();
      }
      ctx.restore();
    }
  },
  impact(ctx) {
    roundRect(ctx, -95, -55, 190, 125, 18);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
    roundRect(ctx, -40, -82, 70, 30, 8); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 8, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 8, 18, 0, Math.PI * 2); ctx.stroke();
  },
  team(ctx) {
    [-48, 48].forEach((x) => {
      ctx.beginPath(); ctx.arc(x, -40, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, 70, 58, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  },
  partners(ctx) {
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(-38, 0, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(38, 0, 58, 0, Math.PI * 2); ctx.stroke();
  },
  donate(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.bezierCurveTo(-120, -10, -70, -110, 0, -45);
    ctx.bezierCurveTo(70, -110, 120, -10, 0, 70);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
  },
  instagram(ctx) {
    roundRect(ctx, -62, -105, 124, 210, 22);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -32); ctx.lineTo(30, 0); ctx.lineTo(-18, 32); ctx.closePath();
    ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-30, 82); ctx.lineTo(30, 82); ctx.stroke();
  },
  discord(ctx) {
    roundRect(ctx, -100, -75, 200, 125, 40);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-40, 50); ctx.lineTo(-62, 92); ctx.lineTo(-4, 50);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
    [-45, 0, 45].forEach((x) => {
      ctx.beginPath(); ctx.arc(x, -12, 11, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    });
  },
};

function cardTexture(card, renderer) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 640;
  const ctx = c.getContext("2d");
  roundRect(ctx, 6, 6, 1012, 628, 56);
  ctx.fillStyle = card.color; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = "rgba(20,33,61,0.9)"; ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `600 34px ${BODY}`;
  ctx.fillText("Elevate STEM", 60, 92);
  ctx.textAlign = "right";
  ctx.fillText(card.kicker, 964, 92);
  ctx.textAlign = "left";

  ctx.font = `800 128px ${DISPLAY}`;
  const words = card.title.split(" ");
  const lines = words.length > 1 && ctx.measureText(card.title).width > 600
    ? [words.slice(0, -1).join(" "), words.at(-1)]
    : [card.title];
  lines.forEach((line, i) => ctx.fillText(line, 56, 250 + i * 118));

  ctx.font = `500 36px ${BODY}`;
  ctx.fillStyle = "rgba(20,33,61,0.8)";
  ctx.fillText(card.text, 60, 570);

  ctx.save();
  ctx.translate(819, 300);
  ctx.lineWidth = 9; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = INK;
  DOODLES[card.doodle]?.(ctx);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function ribbonTexture(text) {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 128;
  const ctx = c.getContext("2d");
  // the logo's blue-to-green gradient, with cream lettering
  const grad = ctx.createLinearGradient(0, 0, c.width, 0);
  [["#36549d", 0], ["#338f68", 0.25], ["#33cc34", 0.5], ["#338f68", 0.75], ["#36549d", 1]].forEach(([col, at]) => grad.addColorStop(at, col));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f7e7d8"; ctx.font = `800 76px ${DISPLAY}`; ctx.textBaseline = "middle";
  let x = 20;
  while (x < c.width) { ctx.fillText(text, x, 68); x += ctx.measureText(text).width + 10; }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function cloudTexture(seed) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 320;
  const ctx = c.getContext("2d");
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const puffs = [];
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    puffs.push([90 + t * 330 + rnd() * 30, 200 - Math.sin(t * Math.PI) * (70 + rnd() * 40) + rnd() * 20, 50 + Math.sin(t * Math.PI) * 50 + rnd() * 25]);
  }
  for (const [x, y, r] of puffs) {
    const g = ctx.createRadialGradient(x, y + r * 0.25, r * 0.2, x, y + r * 0.25, r);
    g.addColorStop(0, "rgba(226,236,248,0.95)"); g.addColorStop(0.7, "rgba(226,236,248,0.6)"); g.addColorStop(1, "rgba(226,236,248,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + r * 0.25, r, 0, Math.PI * 2); ctx.fill();
  }
  for (const [x, y, r] of puffs) {
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.1, x, y, r * 0.95);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.6, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ───────── Scene ─────────
export async function createAtomScene(canvas, { cards, onSelect, onHoverChange, reducedMotion }) {
  try {
    await Promise.all([
      document.fonts.load(`800 128px ${DISPLAY}`),
      document.fonts.load(`600 34px ${BODY}`),
      document.fonts.load(`500 36px ${BODY}`),
    ]);
  } catch { /* system font fallback */ }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const camBase = new THREE.Vector3(0, 1.6, 14);
  scene.add(new THREE.HemisphereLight(0xdff0ff, 0x8fb6d8, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
  sun.position.set(5, 8, 6);
  scene.add(sun);

  const world = new THREE.Group(); // placed for layout
  scene.add(world);
  const atom = new THREE.Group();  // bobs gently
  world.add(atom);

  // nucleus: packed glossy spheres in the brand colors
  const nucleus = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(0.44, 48, 32);
  const nucColors = ["#5fd35f", "#4c6fbf", "#f7e7d8", "#3aa67a"];
  const N = 13;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    const mat = new THREE.MeshPhysicalMaterial({ color: nucColors[i % nucColors.length], roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
    const s = new THREE.Mesh(sphereGeo, mat);
    s.position.set(Math.cos(th) * r * 0.55, y * 0.55, Math.sin(th) * r * 0.55);
    nucleus.add(s);
  }
  atom.add(nucleus);

  // three electron orbits
  const electrons = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  const eMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", emissive: "#8fd0ff", emissiveIntensity: 0.9, roughness: 0.2, clearcoat: 1 });
  const eGeo = new THREE.SphereGeometry(0.13, 24, 16);
  [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((rz, i) => {
    const g = new THREE.Group();
    g.rotation.set(Math.PI / 2.4, 0, rz);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.014, 8, 160), ringMat));
    const e = new THREE.Mesh(eGeo, eMat);
    g.add(e);
    atom.add(g);
    electrons.push({ e, speed: 0.9 + i * 0.35, phase: i * 2.1 });
  });

  // the ring of curved cards, one per place on the site
  const ring = new THREE.Group();
  ring.rotation.x = 0.16;
  atom.add(ring);
  const R = 3.7;
  const H = 1.62;
  const step = (Math.PI * 2) / cards.length;
  const arc = step * 0.86;
  const cardMeshes = cards.map((card, i) => {
    const geo = new THREE.CylinderGeometry(R, R, H, 40, 1, true, -arc / 2, arc);
    const mat = new THREE.MeshStandardMaterial({
      map: cardTexture(card, renderer), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide,
      roughness: 0.6, metalness: 0, envMapIntensity: 0.55, toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const holder = new THREE.Group();
    holder.rotation.y = i * step;
    holder.add(mesh);
    ring.add(holder);
    mesh.userData = { card, holder, lift: 0 };
    return mesh;
  });

  // a ribbon band under the cards
  const ribbon = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.985, R * 0.985, 0.34, 120, 1, true),
    new THREE.MeshStandardMaterial({ map: ribbonTexture("BUILT BY STUDENTS, FOR STUDENTS  ✦  "), roughness: 0.6, envMapIntensity: 0.55, toneMapped: false, side: THREE.DoubleSide })
  );
  ribbon.position.y = -H / 2 - 0.32;
  ring.add(ribbon);

  // clouds
  const clouds = [];
  [
    [12, 3.2, -12, 9], [17, 6.5, -20, 11], [-19, 6, -20, 10], [15, -0.5, -15, 9],
    [0, -7, -13, 11], [-13, -4.2, -7, 7], [12.5, -4, -6, 6.5],
    [8.5, -5.6, 2, 5], [-8, -6, 3, 4.6],
  ].forEach(([x, y, z, size], i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(i + 1), transparent: true, depthWrite: false, toneMapped: false, opacity: z > 0 ? 0.94 : 1 }));
    sp.scale.set(size, size * 0.62, 1);
    sp.position.set(x, y, z);
    sp.renderOrder = z > 0 ? 3 : -1;
    scene.add(sp);
    clouds.push({ sp, baseX: x, speed: 0.08 + (i % 4) * 0.035 });
  });

  // ───────── Layout ─────────
  let w = 1, h = 1, narrow = false;
  function resize() {
    w = Math.max(1, canvas.clientWidth); h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w / h < 1.05;
    camera.fov = narrow ? 36 : 34;
    camera.updateProjectionMatrix();
    if (narrow) { world.position.set(0, 0.2, 0); world.scale.setScalar(1.2); }
    else {
      const wide = w / h;
      world.position.set(wide > 1.5 ? 3.7 : 3.2, -0.25, 0);
      world.scale.setScalar(wide > 1.5 ? 0.8 : 0.72);
    }
  }
  resize();
  const ro = new ResizeObserver(resize);
  const quality = adaptiveQuality(renderer, () => {}, { max: 1.25 });
  ro.observe(canvas);

  // ───────── Interaction ─────────
  let spin = 0.35, vel = 0, dragging = false, lastX = 0, downX = 0, downY = 0, moved = 0;
  const idle = reducedMotion ? 0 : 0.11;
  const pointer = new THREE.Vector2(-9, -9);
  const parallax = { x: 0, y: 0 };
  const ray = new THREE.Raycaster();
  let hovered = null;

  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    parallax.x = pointer.x; parallax.y = pointer.y;
  };
  const pick = () => {
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(cardMeshes, false)[0];
    return hit ? hit.object : null;
  };
  const onDown = (e) => {
    dragging = true; lastX = downX = e.clientX; downY = e.clientY; moved = 0;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    toNdc(e);
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    spin += dx * 0.006;
    vel = dx * 0.006 * 60;
  };
  const onUp = (e) => {
    const wasClick = dragging && moved < 6 && Math.abs(e.clientY - downY) < 6 && Math.abs(e.clientX - downX) < 6;
    dragging = false;
    if (wasClick) { toNdc(e); const m = pick(); if (m) onSelect(m.userData.card); }
  };
  const onLeave = () => { pointer.set(-9, -9); parallax.x = parallax.y = 0; };
  let lastScroll = window.scrollY;
  const onScroll = () => { const d = window.scrollY - lastScroll; lastScroll = window.scrollY; if (!reducedMotion) vel += d * 0.012; };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  canvas.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });

  // keyboard: when a card's link gets focus, turn the ring so that card faces the front
  let target = null;
  function focusCard(i) {
    let t = -i * step;
    while (t - spin > Math.PI) t -= Math.PI * 2;
    while (spin - t > Math.PI) t += Math.PI * 2;
    target = t;
  }

  // ───────── Loop ─────────
  const clock = new THREE.Clock();
  let raf = 0, running = true, visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && running && !raf) (quality.reset(), loop()); });
  io.observe(canvas);

  function loop() {
    raf = 0;
    if (!running || !visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (target !== null) {
      spin += (target - spin) * Math.min(1, dt * 5);
      vel = 0;
      if (Math.abs(target - spin) < 0.002) target = null;
    } else if (!dragging) {
      spin += (vel + idle) * dt;
      vel *= Math.pow(0.04, dt);
    }
    ring.rotation.y = spin;
    ribbon.rotation.y = -spin * 0.35 - t * 0.05 * (reducedMotion ? 0 : 1);
    atom.position.y = reducedMotion ? 0 : Math.sin(t * 0.8) * 0.12;
    nucleus.rotation.y = t * 0.25;
    nucleus.rotation.x = Math.sin(t * 0.3) * 0.25;
    electrons.forEach((o) => {
      const a = o.phase + t * o.speed * (reducedMotion ? 0.2 : 1);
      o.e.position.set(Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0);
    });
    clouds.forEach((c) => { c.sp.position.x = c.baseX + Math.sin(t * c.speed * 0.5 + c.baseX) * 0.8; });

    camera.position.x += (camBase.x + parallax.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (camBase.y + parallax.y * 0.35 - camera.position.y) * 0.04;
    camera.position.z = camBase.z;
    camera.lookAt(narrow ? 0 : 0.4, narrow ? -0.3 : 0.2, 0);

    // hovered card grows a little
    const now = !dragging && pointer.x > -2 ? pick() : null;
    if (now !== hovered) {
      hovered = now;
      canvas.style.cursor = hovered ? "pointer" : "grab";
      onHoverChange?.(hovered ? hovered.userData.card : null);
    }
    cardMeshes.forEach((m) => {
      const goal = m === hovered ? 1 : 0;
      m.userData.lift += (goal - m.userData.lift) * Math.min(1, dt * 10);
      m.scale.setScalar(1 + m.userData.lift * 0.05);
    });

    quality.frame(performance.now()); renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  const onVis = () => { if (!document.hidden && !raf) { clock.getDelta(); quality.reset(); loop(); } };
  document.addEventListener("visibilitychange", onVis);
  loop();

  return {
    focusCard,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
