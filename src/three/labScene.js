// The 3D lab for the elephant toothpaste experiment: a tiled lab wall, a black epoxy bench with a tray,
// a thin glass Erlenmeyer flask with printed graduations, see-through liquid that takes on the dye color,
// rising soap bubbles, labeled bottles that swing in and pour a real stream, and a striped column of foam
// that shoots out of the neck when the yeast goes in.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const NECK_Y = 2.24;
const FOAM_HOLD = 2700; // ms the 3D foam column grows before the screen-filling gush
const BOTTOM_Y = 0.1;
const FULL_Y = 1.56;

// inside radius of the flask at height y (round base → cone → neck)
function innerR(y) {
  if (y < 0.22) return 0.9 + ((y - BOTTOM_Y) / 0.12) * 0.08;
  if (y < 1.52) return 0.98 - ((y - 0.22) / 1.3) * 0.74;
  return 0.235;
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}

// soft blue pegboard wall with a window glow behind the flask (from the Lab design)
function pegboardTexture() {
  return canvasTex(1024, 576, (ctx, w, h) => {
    ctx.fillStyle = "#dfe8f6"; ctx.fillRect(0, 0, w, h);
    for (let y = 18; y < h; y += 36) for (let x = 18; x < w; x += 36) {
      ctx.fillStyle = "#b2c4e2"; ctx.beginPath(); ctx.arc(x, y - 1, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c9d7ee"; ctx.beginPath(); ctx.arc(x, y + 0.6, 4.2, 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.5);
    g.addColorStop(0, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

// printed white graduation marks on the flask, like a real Erlenmeyer
function gradTexture() {
  return canvasTex(1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 34px Figtree Variable, system-ui, sans-serif";
    const marks = [[0.22, "500 ml"], [0.4, "400"], [0.56, "300"], [0.71, "200"], [0.84, "100"]];
    for (const [t, label] of marks) {
      const y = h * t;
      ctx.fillRect(w * 0.42, y, w * 0.09, 6);
      ctx.fillText(label, w * 0.42, y - 12);
    }
    for (let i = 0; i < 12; i++) ctx.fillRect(w * 0.42, h * (0.22 + i * 0.054), w * 0.045, 3);
    ctx.font = "700 26px Figtree Variable, system-ui, sans-serif";
    ctx.fillText("±5%", w * 0.53, h * 0.92);
  });
}

function labelTexture(kind, color) {
  return canvasTex(512, 256, (ctx, w, h) => {
    if (kind === "peroxide") {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1d4fb8"; ctx.fillRect(0, 0, w, 54);
      ctx.fillStyle = "#ffffff"; ctx.font = "800 34px Figtree Variable, system-ui, sans-serif"; ctx.fillText("FIRST AID", 150, 40);
      ctx.fillStyle = "#14213d"; ctx.font = "800 44px Figtree Variable, system-ui, sans-serif"; ctx.fillText("Hydrogen", 150, 118);
      ctx.fillText("Peroxide", 150, 166);
      ctx.fillStyle = "#c0392b"; ctx.font = "800 40px Figtree Variable, system-ui, sans-serif"; ctx.fillText("3%", 150, 222);
      ctx.fillStyle = "#6b7891"; ctx.font = "600 22px Figtree Variable, system-ui, sans-serif"; ctx.fillText("Topical solution · 16 FL OZ", 220, 222);
    } else if (kind === "soap") {
      ctx.fillStyle = "#1f8f4e"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff"; ctx.font = "800 54px Figtree Variable, system-ui, sans-serif"; ctx.fillText("DISH", 150, 110);
      ctx.fillText("SOAP", 150, 166);
      ctx.font = "600 24px Figtree Variable, system-ui, sans-serif"; ctx.fillText("Lemon · grease cutting", 150, 210);
      ctx.fillStyle = "#f7e15a"; ctx.beginPath(); ctx.arc(400, 120, 40, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "dye") {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color; ctx.fillRect(0, 0, w, 80); ctx.fillRect(0, h - 40, w, 40);
      ctx.fillStyle = "#14213d"; ctx.font = "800 46px Figtree Variable, system-ui, sans-serif"; ctx.fillText("FOOD", 170, 140);
      ctx.fillText("COLOR", 160, 192);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0)"; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 6; i++) ctx.fillRect(220, 40 + i * 34, i % 2 ? 40 : 70, 4);
      ctx.font = "700 22px Figtree Variable, system-ui, sans-serif"; ctx.fillText("250 ml", 300, 52);
    }
  });
}

// glass: mostly clear, brighter and more opaque where you look across its surface (Fresnel), like real glass
function glassMaterial(opacity = 0.12, side = THREE.FrontSide) {
  const m = new THREE.MeshPhysicalMaterial({
    color: "#ffffff", roughness: 0.02, metalness: 0, transparent: true, opacity, depthWrite: false, side,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, specularIntensity: 1, ior: 1.5,
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <dithering_fragment>",
      `float fres = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.6);
       gl_FragColor.rgb += fres * 0.28;
       gl_FragColor.a = clamp(gl_FragColor.a + fres * 0.62, 0.0, 0.92);
       #include <dithering_fragment>`
    );
  };
  return m;
}

const plastic = (color, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, ...extra });

// ───────── Bottles: built with the mouth at the origin and the body below it ─────────
function makeBottle(kind, color) {
  const g = new THREE.Group();
  const label = (r, hgt, y) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 48, 1, true, -Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshStandardMaterial({ map: labelTexture(kind, color), roughness: 0.55, transparent: kind === "yeast" }));
    m.position.y = y; m.rotation.y = Math.PI;
    return m;
  };
  if (kind === "peroxide") {
    // the brown plastic pharmacy bottle
    const pts = [[0, -1.18], [0.3, -1.18], [0.33, -1.14], [0.33, -0.36], [0.24, -0.2], [0.11, -0.12], [0.11, 0]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), plastic("#5a2f15", { roughness: 0.28, clearcoat: 0.9 })));
    g.add(label(0.336, 0.62, -0.74));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 32), plastic("#f5f5f2"));
    cap.position.y = 0.06;
    g.add(cap);
  } else if (kind === "soap") {
    const pts = [[0, -1.2], [0.28, -1.2], [0.32, -1.15], [0.32, -0.42], [0.22, -0.2], [0.09, -0.1], [0.09, 0]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), plastic("#f2cf3a", { roughness: 0.12, transparent: true, opacity: 0.92 })));
    g.add(label(0.325, 0.5, -0.72));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.18, 24), plastic("#1f8f4e"));
    cap.position.y = 0.04;
    g.add(cap);
  } else if (kind === "dye") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.52, 32), plastic("#ffffff", { transparent: true, opacity: 0.55 }));
    body.position.y = -0.4;
    const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 32), plastic(color, { roughness: 0.15 }));
    ink.position.y = -0.44;
    g.add(ink, body, label(0.173, 0.26, -0.4));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.26, 32), plastic(color));
    tip.position.y = -0.03;
    g.add(tip);
  } else {
    // a glass beaker of warm yeast water with froth on top
    const outer = [[0, -0.95], [0.38, -0.95], [0.4, -0.92], [0.4, 0], [0.44, 0.03], [0.37, 0.03], [0.37, -0.91], [0, -0.92]].map(([x, y]) => new THREE.Vector2(x, y));
    const glass = new THREE.Mesh(new THREE.LatheGeometry(outer, 48), glassMaterial(0.18, THREE.DoubleSide));
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.56, 40), plastic("#c79a5c", { roughness: 0.4, clearcoat: 0.4 }));
    water.position.y = -0.63;
    const froth = new THREE.Mesh(new THREE.CylinderGeometry(0.362, 0.362, 0.07, 40), new THREE.MeshStandardMaterial({ color: "#ecdcbc", roughness: 0.95 }));
    froth.position.y = -0.32;
    g.add(water, froth, glass, label(0.405, 0.6, -0.5));
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createLabScene(canvas, { reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dfe8f6");
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env;

  // soft window light from the upper left, with real shadows, plus a little fill
  const sun = new THREE.DirectionalLight(0xfff6ea, 2.0);
  sun.position.set(-3.5, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -2;
  sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
  scene.add(sun, new THREE.HemisphereLight(0xf2f6ff, 0x1c2a4c, 0.5));

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const camBase = new THREE.Vector3(0, 2.7, 11.2);
  const look = new THREE.Vector3(0.15, 1.95, 0);

  // ───────── Room: tiled wall, black epoxy lab bench, a plastic tray ─────────
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: pegboardTexture(), toneMapped: false }));
  wall.position.set(0, 3.2, -3.2);
  wall.receiveShadow = true;
  scene.add(wall);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 7), new THREE.MeshPhysicalMaterial({ color: "#0c1530", roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.5 }));
  bench.position.set(0, -0.15, 0.2);
  bench.receiveShadow = true;
  scene.add(bench);
  const trayShape = new THREE.Shape();
  const tw = 3.4, td = 2.4, tr = 0.3;
  trayShape.moveTo(-tw / 2 + tr, -td / 2);
  trayShape.lineTo(tw / 2 - tr, -td / 2); trayShape.quadraticCurveTo(tw / 2, -td / 2, tw / 2, -td / 2 + tr);
  trayShape.lineTo(tw / 2, td / 2 - tr); trayShape.quadraticCurveTo(tw / 2, td / 2, tw / 2 - tr, td / 2);
  trayShape.lineTo(-tw / 2 + tr, td / 2); trayShape.quadraticCurveTo(-tw / 2, td / 2, -tw / 2, td / 2 - tr);
  trayShape.lineTo(-tw / 2, -td / 2 + tr); trayShape.quadraticCurveTo(-tw / 2, -td / 2, -tw / 2 + tr, -td / 2);
  const tray = new THREE.Mesh(
    new THREE.ExtrudeGeometry(trayShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: "#f7e7d8", roughness: 0.45, clearcoat: 0.4 })
  );
  tray.rotation.x = -Math.PI / 2;
  tray.position.y = -0.01;
  tray.receiveShadow = true;
  scene.add(tray);

  // ───────── Flask: one lathe for the glass wall (outside up, lip, inside down) ─────────
  const lift = 0.1;   // sits on the tray
  const flaskGroup = new THREE.Group();
  flaskGroup.position.y = lift;
  scene.add(flaskGroup);
  const wallPts = [
    [0, 0], [0.96, 0], [1.05, 0.05], [1.08, 0.16], [0.3, 1.46], [0.27, 1.56], [0.27, 2.14], [0.335, 2.17], [0.335, 2.24],
    [0.235, 2.24], [0.235, 1.56], [0.98, 0.22], [0.9, BOTTOM_Y], [0, BOTTOM_Y],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const flaskGeo = new THREE.LatheGeometry(wallPts, 96);
  const glassBack = new THREE.Mesh(flaskGeo, glassMaterial(0.08, THREE.BackSide));
  const glassFront = new THREE.Mesh(flaskGeo, glassMaterial(0.1, THREE.FrontSide));
  glassBack.renderOrder = 1; glassFront.renderOrder = 3;
  // the thick glass base catches light like a real flask
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 1.0, BOTTOM_Y, 64), glassMaterial(0.35));
  base.position.y = BOTTOM_Y / 2; base.renderOrder = 2;
  // printed graduations on the front of the cone
  const gradGeo = new THREE.LatheGeometry(
    [[1.0, 0.24], [0.3, 1.48]].map(([x, y]) => new THREE.Vector2(x + 0.012, y)), 48, -Math.PI * 0.32, Math.PI * 0.64
  );
  const grads = new THREE.Mesh(gradGeo, new THREE.MeshBasicMaterial({ map: gradTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  grads.rotation.y = Math.PI * 0.12; grads.renderOrder = 4;
  flaskGroup.add(glassBack, base, glassFront, grads);

  // contact shadow so the glass sits on the tray
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshBasicMaterial({
    map: canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(10,14,24,0.45)"); g.addColorStop(0.5, "rgba(10,14,24,0.14)"); g.addColorStop(1, "rgba(10,14,24,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false,
  }));
  cs.rotation.x = -Math.PI / 2; cs.position.y = 0.1;
  scene.add(cs);

  // ───────── Liquid: see-through, tinted by distance like real colored water ─────────
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: "#e6f3ff", roughness: 0.04, transparent: true, opacity: 0.42, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, emissive: "#000000",
  });
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
  liquid.visible = false;
  liquid.renderOrder = 2;
  flaskGroup.add(liquid);
  let levelNow = 0, levelTo = 0;
  function buildLiquid(level) {
    const top = BOTTOM_Y + level * (FULL_Y - BOTTOM_Y);
    const pts = [new THREE.Vector2(0, BOTTOM_Y + 0.004)];
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const y = BOTTOM_Y + 0.004 + (i / n) * (top - BOTTOM_Y - 0.004);
      pts.push(new THREE.Vector2(innerR(y) - 0.012, y));
    }
    // a little meniscus where the liquid meets the glass
    const rTop = innerR(top) - 0.012;
    pts.push(new THREE.Vector2(rTop - 0.03, top - 0.012), new THREE.Vector2(0, top - 0.018));
    liquid.geometry.dispose();
    liquid.geometry = new THREE.LatheGeometry(pts, 72);
    liquid.visible = level > 0.005;
  }
  const tintNow = new THREE.Color("#e6f3ff"), tintTo = new THREE.Color("#e6f3ff");
  // distNow/distTo hold the liquid's opacity: clear water is faint, dyed water is rich
  let distNow = 0.42, distTo = 0.42, cloudNow = 0.04, cloudTo = 0.04;

  // ───────── Dye swirls: colored ribbons that curl down through the liquid and fade ─────────
  const swirls = [];
  function addSwirl(hex) {
    const top = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);
    for (let k = 0; k < 3; k++) {
      const pts = [];
      const a0 = Math.random() * Math.PI * 2;
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, y = top - 0.05 - t * (top - BOTTOM_Y - 0.15);
        const r = (innerR(y) - 0.18) * (0.2 + 0.7 * t);
        pts.push(new THREE.Vector3(Math.cos(a0 + t * 7 + k) * r, y, Math.sin(a0 + t * 7 + k) * r));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.035, 8), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4 }));
      tube.geometry.setDrawRange(0, 0);
      flaskGroup.add(tube);
      swirls.push({ tube, t: -k * 0.15, total: tube.geometry.index.count });
    }
  }

  // ───────── Bubbles and soap suds ─────────
  const B = 60;
  const bubbleMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, clearcoat: 1, emissive: "#ffffff", emissiveIntensity: 0.12 });
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), bubbleMat, B);
  bubbles.count = 0;
  flaskGroup.add(bubbles);
  const bub = Array.from({ length: B }, () => ({ y: BOTTOM_Y + Math.random() * 0.6, a: Math.random() * Math.PI * 2, d: Math.random(), r: 0.012 + Math.random() * 0.028, s: 0.2 + Math.random() * 0.45 }));
  let soapy = false, fizz = 1;

  const S = 90;
  const suds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: "#fbfbf7", roughness: 0.6 }), S);
  suds.count = 0;
  flaskGroup.add(suds);
  const sudSeeds = Array.from({ length: S }, () => ({ a: Math.random() * Math.PI * 2, d: Math.sqrt(Math.random()), r: 0.03 + Math.random() * 0.035, j: Math.random() * 6 }));

  // ───────── The foam column: a thick, lumpy, striped rope of foam that pushes out of the neck,
  // rises, flops over, and piles onto the tray, like real elephant toothpaste ─────────
  const foamPath = new THREE.CatmullRomCurve3([
    [0, NECK_Y - 0.25, 0], [0, NECK_Y + 0.3, 0], [0.05, NECK_Y + 0.95, 0.05], [0.45, NECK_Y + 1.35, 0.1],
    [1.05, NECK_Y + 1.15, 0.15], [1.35, NECK_Y + 0.35, 0.2], [1.45, 0.9, 0.35], [1.3, 0.25, 0.5], [0.7, 0.18, 0.75], [0.1, 0.22, 0.8],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, "catmullrom", 0.4);
  const FSEG = 420, FRAD = 36;
  const foamGeo = new THREE.TubeGeometry(foamPath, FSEG, 0.3, FRAD, false);
  {
    // lumps: push each vertex out along its normal by a little bumpy noise; fatter as it leaves the neck
    const pos = foamGeo.attributes.position, nor = foamGeo.attributes.normal;
    const center = new THREE.Vector3(), p = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const seg = Math.floor(i / (FRAD + 1)), ring = i % (FRAD + 1);
      const u = seg / FSEG;
      foamPath.getPointAt(Math.min(1, u), center);
      p.fromBufferAttribute(pos, i); n.fromBufferAttribute(nor, i);
      // soft puffy bulges: a few low-frequency waves around and along the rope, nothing sharp
      const ang = (ring / FRAD) * Math.PI * 2;
      const bump = 0.045 * Math.sin(3 * ang + u * 31) + 0.035 * Math.sin(2 * ang - u * 19 + 1.3) + 0.05 * Math.pow(Math.sin(u * 46), 2) - 0.02;
      const swell = u < 0.08 ? 0.75 : 1 + Math.min(0.35, (u - 0.08) * 0.7);
      const r = 0.31 * swell + bump;
      p.copy(center).addScaledVector(n, r);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    foamGeo.computeVertexNormals();
  }
  const foamColorsAttr = new THREE.BufferAttribute(new Float32Array(foamGeo.attributes.position.count * 3), 3);
  foamGeo.setAttribute("color", foamColorsAttr);
  const foamMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffffff"),
    bumpMap: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 700; i++) {
        const x = Math.random() * 256, y = Math.random() * 256, r = 1 + Math.random() * Math.random() * 6;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "#4a4a4a"); g.addColorStop(0.8, "#9a9a9a"); g.addColorStop(1, "rgba(128,128,128,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }, { linear: true, repeat: [40, 5] }),
    bumpScale: 0.45,
  });
  const foam = new THREE.Mesh(foamGeo, foamMat);
  foam.castShadow = true;
  foam.visible = false;
  flaskGroup.add(foam);
  const FOAM_IDX = foamGeo.index.count;
  const tipMat = foamMat.clone();
  tipMat.vertexColors = false;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), tipMat);
  tip.castShadow = true;
  tip.visible = false;
  flaskGroup.add(tip);
  const tipColor = new THREE.Color();
  let foamT = -1;
  function paintFoam(colors) {
    const cs = colors.map((c) => new THREE.Color(c));
    const white = new THREE.Color("#fbf8f1");
    const c = new THREE.Color();
    for (let i = 0; i < foamColorsAttr.count; i++) {
      const u = Math.floor(i / (FRAD + 1)) / FSEG;
      // stripes along the length, cream bands between dye colors, like layered real foam
      // bands of each dye with creamy white between them, softly blended at the edges
      const f = u * 11, k = Math.floor(f), edge = f - k;
      const band = (j) => (!cs.length || j % 2 === 1 ? white : cs[Math.floor(j / 2) % cs.length]);
      const blend = edge < 0.2 ? 0.5 - edge * 2.5 : edge > 0.8 ? (edge - 0.8) * 2.5 : 0;
      c.copy(band(k));
      if (edge < 0.2) c.lerp(band(k - 1 < 0 ? 0 : k - 1), blend);
      else if (blend) c.lerp(band(k + 1), blend);
      foamColorsAttr.setXYZ(i, c.r, c.g, c.b);
    }
    foamColorsAttr.needsUpdate = true;
  }

  // ───────── Pouring stream ─────────
  const streamMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 });
  const stream = new THREE.Mesh(new THREE.BufferGeometry(), streamMat);
  stream.visible = false;
  scene.add(stream);
  let pourJob = null;

  // ───────── Layout & loop ─────────
  let w = 1, h = 1, framesLeft = 3;
  const lastCam = new THREE.Vector3(1e9, 0, 0);
  function resize() {
    w = Math.max(1, canvas.clientWidth); h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    framesLeft = 3;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 36 : 28;
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

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  const clock = new THREE.Clock();
  let raf = 0, visible = true, disposed = false, paused = false;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf && !disposed && !paused) { clock.getDelta(); loop(); } });
  io.observe(canvas);

  function loop() {
    raf = 0;
    if (disposed || !visible || paused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (Math.abs(levelTo - levelNow) > 0.0005) { levelNow += (levelTo - levelNow) * Math.min(1, dt * 2.6); buildLiquid(levelNow); }
    tintNow.lerp(tintTo, Math.min(1, dt * 1.4));
    distNow += (distTo - distNow) * Math.min(1, dt * 1.4);
    cloudNow += (cloudTo - cloudNow) * Math.min(1, dt * 2);
    liquidMat.color.copy(tintNow);
    liquidMat.emissive.copy(tintNow).multiplyScalar(0.12 + (distNow - 0.42) * 0.6);
    liquidMat.opacity = distNow;
    liquidMat.roughness = cloudNow;

    const top = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);

    // dye ribbons draw themselves down, then thin out as the color mixes in
    for (let i = swirls.length - 1; i >= 0; i--) {
      const sw = swirls[i];
      sw.t += dt;
      const grow = clamp01(sw.t / 1.1);
      sw.tube.geometry.setDrawRange(0, Math.floor((sw.total * grow) / 3) * 3);
      const fade = clamp01((sw.t - 1.3) / 1.2);
      sw.tube.scale.set(1 + fade * 0.6, 1, 1 + fade * 0.6);
      sw.tube.visible = fade < 1;
      if (fade >= 1) { flaskGroup.remove(sw.tube); sw.tube.geometry.dispose(); sw.tube.material.dispose(); swirls.splice(i, 1); }
    }

    // bubbles rise through the liquid
    const nb = soapy ? Math.min(B, Math.round(20 * fizz)) : 0;
    for (let i = 0; i < nb; i++) {
      const b = bub[i];
      b.y += b.s * dt * fizz;
      if (b.y > top - 0.04) b.y = BOTTOM_Y + 0.03;
      const rr = (innerR(b.y) - 0.07) * b.d;
      v.set(Math.cos(b.a + t * 0.4) * rr, b.y, Math.sin(b.a + t * 0.4) * rr);
      s.setScalar(b.r * (fizz > 1.5 ? 1.4 : 1));
      m.compose(v, q.identity(), s);
      bubbles.setMatrixAt(i, m);
    }
    bubbles.count = nb;
    bubbles.instanceMatrix.needsUpdate = true;

    // a thin layer of suds on the surface once soap is in
    const ns = soapy && levelNow > 0.1 ? S : 0;
    for (let i = 0; i < ns; i++) {
      const sd = sudSeeds[i];
      const rr = (innerR(top) - 0.06) * sd.d;
      v.set(Math.cos(sd.a) * rr, top - 0.005 + Math.sin(t * 2 + sd.j) * 0.004, Math.sin(sd.a) * rr);
      s.setScalar(sd.r * (fizz > 1.5 ? 1.5 + Math.sin(t * 9 + sd.j) * 0.2 : 1));
      m.compose(v, q.identity(), s);
      suds.setMatrixAt(i, m);
    }
    suds.count = ns;
    suds.instanceMatrix.needsUpdate = true;

    // the flask buzzes while it reacts
    flaskGroup.position.x = fizz > 1.5 && !reducedMotion ? Math.sin(t * 80) * 0.01 : 0;

    // foam pushes out of the neck and grows along its path
    if (foamT >= 0) {
      foamT += dt;
      const grow = 1 - Math.pow(1 - clamp01(foamT / 2.2), 2.2);
      foam.visible = true;
      const ringsDrawn = Math.max(1, Math.floor(FSEG * grow));
      foam.geometry.setDrawRange(0, ringsDrawn * FRAD * 6);
      // a round puff caps the end of the rope as it grows
      const ug = Math.min(1, ringsDrawn / FSEG);
      foamPath.getPointAt(ug, tip.position);
      const sw = ug < 0.08 ? 0.75 : 1 + Math.min(0.35, (ug - 0.08) * 0.7);
      tip.scale.setScalar(0.33 * sw);
      // the cap takes the color of the foam right behind it
      const vi = Math.min(foamColorsAttr.count - 1, ringsDrawn * (FRAD + 1));
      tipMat.color.setRGB(foamColorsAttr.getX(vi), foamColorsAttr.getY(vi), foamColorsAttr.getZ(vi));
      tip.visible = true;
    }
    if (pourJob) pourJob.step(dt);

    camera.position.set(camBase.x + pointer.x * 0.5, camBase.y - pointer.y * 0.25, camBase.z);
    camera.lookAt(look);
    // only draw when something actually changed: a pour, rising liquid, bubbles, foam, or the camera moving
    const busy = pourJob || foamT >= 0 || swirls.length || soapy || Math.abs(levelTo - levelNow) > 0.0005 || fizz > 1 ||
      Math.abs(tintTo.r - tintNow.r) + Math.abs(tintTo.g - tintNow.g) + Math.abs(tintTo.b - tintNow.b) > 0.004 ||
      camera.position.distanceToSquared(lastCam) > 1e-6 || framesLeft > 0;
    if (busy) {
      if (pourJob || foamT >= 0) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      lastCam.copy(camera.position);
      if (framesLeft > 0) framesLeft--;
    }
    raf = requestAnimationFrame(loop);
  }
  buildLiquid(0);
  loop();

  // a bottle swings in, tips over the neck, pours a curved stream, and swings back out
  const STREAM_COLOR = { peroxide: "#eaf6ff", soap: "#f2c230", yeast: "#c79a5c" };
  function pour(kind, color, toLevel) {
    return new Promise((resolve) => {
      if (reducedMotion) { levelTo = toLevel; resolve(); return; }
      const bottle = makeBottle(kind, color);
      bottle.rotation.y = -0.5;
      scene.add(bottle);
      const sc = kind === "dye" ? color : STREAM_COLOR[kind];
      streamMat.color.set(kind === "peroxide" ? "#dfefff" : sc);
      streamMat.opacity = kind === "peroxide" ? 0.55 : 0.92;
      const from = new THREE.Vector3(3.6, 3.4, 0.4), at = new THREE.Vector3(0.5, NECK_Y + lift + 0.42, 0.05);
      const tilt = kind === "dye" ? 2.45 : 2.05;
      const thick = kind === "dye" ? 0.016 : kind === "soap" ? 0.03 : 0.04;
      let time = 0;
      const mouth = new THREE.Vector3(), neck = new THREE.Vector3(0, NECK_Y + lift + 0.05, 0);
      pourJob = {
        step(dt) {
          time += dt;
          const tIn = ease(clamp01(time / 0.55));
          const tTip = ease(clamp01((time - 0.4) / 0.4));
          const tBack = ease(clamp01((time - 1.7) / 0.5));
          bottle.position.lerpVectors(from, at, tIn);
          if (tBack > 0) bottle.position.lerpVectors(at, from, tBack);
          bottle.rotation.z = tilt * (tTip - tBack) + 0.25 * tIn;
          const flowing = time > 0.72 && time < 1.72;
          stream.visible = flowing;
          if (flowing) {
            bottle.updateMatrixWorld();
            mouth.set(0, 0, 0).applyMatrix4(bottle.matrixWorld);
            const surface = Math.max(BOTTOM_Y + 0.02, BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y)) + lift;
            // the stream arcs from the mouth, falls into the neck, then straight down to the surface
            const mid = new THREE.Vector3((mouth.x + neck.x) * 0.5, (mouth.y + neck.y) * 0.5 + 0.08, (mouth.z + neck.z) * 0.5);
            const curve = new THREE.CatmullRomCurve3([mouth.clone(), mid, neck.clone(), new THREE.Vector3(0, surface, 0)]);
            const tStart = clamp01((time - 0.72) / 0.18), tEnd = clamp01((1.72 - time) / 0.12);
            stream.geometry.dispose();
            stream.geometry = new THREE.TubeGeometry(curve, 48, thick * Math.min(tStart, tEnd, 1) + 0.004, 10);
            if (time > 0.85) levelTo = toLevel;
          }
          if (time > 2.25) {
            stream.visible = false;
            scene.remove(bottle);
            bottle.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); } });
            pourJob = null;
            resolve();
          }
        },
      };
    });
  }

  return {
    pour,
    // once a dye goes in it curls through the liquid and tints all of it
    addDye(hex, all) {
      if (!reducedMotion) addSwirl(hex);
      const mixc = new THREE.Color(all[0]);
      all.slice(1).forEach((c) => mixc.lerp(new THREE.Color(c), 0.35));
      tintTo.copy(mixc);
      distTo = 0.93;
    },
    setSoap(on) { soapy = on; cloudTo = on ? 0.16 : 0.04; if (on) { tintTo.set("#f1f6e2"); distTo = 0.55; } },
    react(colors) {
      return new Promise((resolve) => {
        fizz = 3.4;
        paintFoam(colors);
        foamT = 0;
        setTimeout(resolve, reducedMotion ? 0 : FOAM_HOLD);
      });
    },
    neckPoint() {
      const p = new THREE.Vector3(0, NECK_Y + lift + 0.1, 0).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + (p.x * 0.5 + 0.5) * r.width, y: r.top + (-p.y * 0.5 + 0.5) * r.height };
    },
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    resume() { paused = false; clock.getDelta(); if (!raf) loop(); },
    reset() {
      framesLeft = 3; renderer.shadowMap.needsUpdate = true;
      levelTo = 0; soapy = false; fizz = 1; foamT = -1; foam.visible = false; tip.visible = false;
      tintTo.set("#e6f3ff"); distTo = 0.42; cloudTo = 0.04;
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
