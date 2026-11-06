// The 3D lab for the elephant toothpaste experiment: a tiled lab wall, a black epoxy bench with a tray,
// a thin glass Erlenmeyer flask with printed graduations, see-through liquid that takes on the dye color,
// rising soap bubbles, bottles that swing in and pour one continuous stream each (liquid, a thin line of dye,
// a sandy ribbon of yeast) with dye curling through the water, and a striped column of foam that shoots out
// of the neck when the yeast goes in.
import * as THREE from "three";
import { adaptiveQuality } from "./quality.js";
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
const smoothstep = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

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

// The yeast packet: a pillowy paper sachet with crimped ends, a red band and a label.
// Built with its top-right (tear) corner at the origin so tipping it pours from that corner.
function packetTexture() {
  return canvasTex(512, 704, (ctx, w, h) => {
    ctx.fillStyle = "#f2c879"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d9482b"; ctx.fillRect(0, 0, w, 150);
    // crimped seams top and bottom
    for (const y0 of [0, h - 46]) {
      ctx.fillStyle = y0 ? "#e2b862" : "#c23c22"; ctx.fillRect(0, y0, w, 46);
      ctx.strokeStyle = "rgba(20,33,61,0.25)"; ctx.lineWidth = 3;
      for (let x = 6; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, y0 + 4); ctx.lineTo(x, y0 + 42); ctx.stroke(); }
    }
    ctx.fillStyle = "#ffffff"; ctx.font = "800 46px Figtree Variable, system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("ACTIVE DRY", w / 2, 118);
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#14213d"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(70, 230, w - 140, 260, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#14213d"; ctx.font = "800 96px Figtree Variable, system-ui, sans-serif"; ctx.fillText("YEAST", w / 2, 368);
    ctx.font = "600 34px Figtree Variable, system-ui, sans-serif"; ctx.fillStyle = "#44526e"; ctx.fillText("1 packet · ¼ oz", w / 2, 436);
    ctx.fillStyle = "#c4934f";
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(90 + Math.random() * (w - 180), 540 + Math.random() * 90, 5 + Math.random() * 4, 0, Math.PI * 2); ctx.fill(); }
    // dashed "tear here" notch near the top-right corner
    ctx.strokeStyle = "rgba(20,33,61,0.55)"; ctx.setLineDash([10, 9]); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w - 120, 0); ctx.lineTo(w, 120); ctx.stroke();
  });
}
function makePacket() {
  const W = 0.62, H = 0.86, D = 0.07;
  const geo = new THREE.BoxGeometry(W, H, D, 16, 20, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (W / 2), y = pos.getY(i) / (H / 2), z = pos.getZ(i);
    // puff the faces out like a filled sachet, flat at the crimped seams
    const bulge = Math.max(0, 1 - x * x) * Math.max(0, 1 - Math.pow(Math.abs(y), 6)) * 0.07;
    pos.setZ(i, z + Math.sign(z) * bulge);
  }
  geo.computeVertexNormals();
  const tex = packetTexture();
  const face = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.25 });
  const edge = new THREE.MeshStandardMaterial({ color: "#e9bd6b", roughness: 0.7 });
  const body = new THREE.Mesh(geo, [edge, edge, edge, edge, face, face]);
  body.position.set(-W / 2, -H / 2, 0);
  body.castShadow = true;
  // the corner strip that tears off
  const flapShape = new THREE.Shape();
  flapShape.moveTo(0, 0); flapShape.lineTo(-0.15, 0); flapShape.lineTo(0, -0.15); flapShape.lineTo(0, 0);
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), new THREE.MeshStandardMaterial({ color: "#c23c22", roughness: 0.6, side: THREE.DoubleSide }));
  flap.position.z = D / 2 + 0.072;
  const group = new THREE.Group();
  group.add(body, flap);
  return { group, flap };
}

// A tube whose thickness can change along its length. It is rebuilt in place every frame
// (same buffers, no new geometry), which keeps pouring streams smooth and cheap.
function makeFlowTube(seg = 72, rad = 12) {
  const geo = new THREE.BufferGeometry();
  const nV = (seg + 1) * (rad + 1);
  const pos = new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const nor = new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uvs = new THREE.BufferAttribute(new Float32Array(nV * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const idx = [];
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) {
    const a = i * (rad + 1) + j, b = a + rad + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  geo.setIndex(idx);
  geo.setAttribute("position", pos); geo.setAttribute("normal", nor); geo.setAttribute("uv", uvs);
  const P = new THREE.Vector3(), Pa = new THREE.Vector3(), Pb = new THREE.Vector3();
  const T = new THREE.Vector3(), N = new THREE.Vector3(), Bn = new THREE.Vector3(), D = new THREE.Vector3();
  // pointAt(u, out) gives the centre line; radiusAt(u) the thickness; u runs 0..1 along the whole path
  function update(pointAt, u0, u1, radiusAt, uvLen = 1) {
    let k = 0, kk = 0;
    for (let i = 0; i <= seg; i++) {
      const u = Math.min(1, Math.max(0, u0 + ((u1 - u0) * i) / seg));   // rounding can land a hair past 1
      pointAt(u, P);
      pointAt(Math.min(1, u + 0.004), Pb); pointAt(Math.max(0, u - 0.004), Pa);
      T.subVectors(Pb, Pa).normalize();
      if (i === 0) { N.set(0, 1, 0); if (Math.abs(T.y) > 0.9) N.set(1, 0, 0); N.crossVectors(T, N).normalize(); }
      else N.addScaledVector(T, -T.dot(N)).normalize();   // carry the frame along so the tube never twists
      Bn.crossVectors(T, N);
      const r = Math.max(0.0005, radiusAt(u));
      for (let j = 0; j <= rad; j++) {
        const a = (j / rad) * Math.PI * 2;
        D.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(Bn, Math.sin(a));
        pos.array[k] = P.x + D.x * r; nor.array[k++] = D.x;
        pos.array[k] = P.y + D.y * r; nor.array[k++] = D.y;
        pos.array[k] = P.z + D.z * r; nor.array[k++] = D.z;
        uvs.array[kk++] = u * uvLen; uvs.array[kk++] = j / rad;
      }
    }
    pos.needsUpdate = nor.needsUpdate = uvs.needsUpdate = true;
  }
  return { geo, update };
}

// Shading for poured liquid, a falling ribbon of yeast, and dye curling through the water.
// Glossy liquid gets a bright rim and a highlight; little ripples slide down the stream so it reads as flowing.
function flowMaterial({ color, opacity = 1, gloss = 1, grain = 0, plume = 0 }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uTime: { value: 0 },
      uGloss: { value: gloss }, uGrain: { value: grain }, uPlume: { value: plume },
    },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uGloss; uniform float uGrain; uniform float uPlume;
      varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        float ndv = abs(dot(n, v));
        float fres = pow(1.0 - ndv, 3.0);
        vec3 L = normalize(vec3(-3.5, 6.0, 4.0));
        float spec = pow(max(dot(reflect(-L, n), v), 0.0), 48.0);
        float flow = 0.5 + 0.5 * sin(vUv.x * 34.0 - uTime * 15.0 + sin(vUv.y * 18.85) * 0.9);
        vec3 col = uColor * (0.72 + 0.28 * ndv) * (0.93 + 0.12 * flow);
        vec3 env = mix(vec3(0.52, 0.58, 0.72), vec3(1.0), smoothstep(-0.3, 0.9, reflect(-v, n).y));
        col = mix(col, env, fres * 0.65 * uGloss) + spec * uGloss * (0.8 + 0.3 * flow);
        float a = uOpacity * mix(1.0, 0.7 + 0.6 * fres, uGloss);
        if (uGrain > 0.5) {
          // a sandy ribbon: speckled color, ragged edges, grains racing down
          float g = hash(floor(vec2(vUv.x * 110.0 - uTime * 70.0, vUv.y * 18.0)));
          col *= 0.68 + 0.6 * g;
          a *= smoothstep(0.08, 0.5, ndv + g * 0.4);
        }
        if (uPlume > 0.5) {
          // dye curling through water: dense in the middle, soft wispy edges
          float w = 0.5 + 0.5 * sin(vUv.x * 9.0 - uTime * 2.4 + vUv.y * 6.2832);
          col = uColor * (0.85 + 0.25 * w);
          a = uOpacity * pow(ndv, 1.5) * (0.7 + 0.3 * w);
        }
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
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
  // (the flat bottom faces are left out of the lathe: seen at a low angle the glass rim-glow turned them
  // into a solid white disc. The base gets its own, clearer pieces below.)
  const wallPts = [
    [0.96, 0], [1.05, 0.05], [1.08, 0.16], [0.3, 1.46], [0.27, 1.56], [0.27, 2.14], [0.335, 2.17], [0.335, 2.24],
    [0.235, 2.24], [0.235, 1.56], [0.98, 0.22], [0.9, BOTTOM_Y],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const flaskGeo = new THREE.LatheGeometry(wallPts, 96);
  const glassBack = new THREE.Mesh(flaskGeo, glassMaterial(0.08, THREE.BackSide));
  const glassFront = new THREE.Mesh(flaskGeo, glassMaterial(0.1, THREE.FrontSide));
  glassBack.renderOrder = 1; glassFront.renderOrder = 3;
  // the thick glass base: a clear disc you can see the tray through, with the darker, slightly green
  // edge that thick glass has and a thin bright rim where the light catches it
  const base = new THREE.Group();
  const baseSide = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 1.0, BOTTOM_Y, 64, 1, true), glassMaterial(0.16));
  baseSide.position.y = BOTTOM_Y / 2;
  const baseDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.965, 64),
    new THREE.MeshBasicMaterial({
      map: canvasTex(256, 256, (ctx, w2) => {
        const c2 = w2 / 2;
        const g = ctx.createRadialGradient(c2, c2, 0, c2, c2, c2);
        g.addColorStop(0, "rgba(210,232,228,0.05)"); g.addColorStop(0.72, "rgba(190,216,212,0.1)");
        g.addColorStop(0.9, "rgba(120,150,150,0.28)"); g.addColorStop(0.965, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w2, w2);
      }),
      transparent: true, depthWrite: false, toneMapped: false,
    })
  );
  baseDisc.rotation.x = -Math.PI / 2; baseDisc.position.y = BOTTOM_Y - 0.002;
  base.add(baseSide, baseDisc);
  base.traverse((o) => { o.renderOrder = 2; });
  // printed graduations on the front of the cone
  const gradGeo = new THREE.LatheGeometry(
    [[1.0, 0.24], [0.3, 1.48]].map(([x, y]) => new THREE.Vector2(x + 0.012, y)), 48, -Math.PI * 0.32, Math.PI * 0.64
  );
  const grads = new THREE.Mesh(gradGeo, new THREE.MeshBasicMaterial({ map: gradTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  grads.rotation.y = Math.PI * 0.12; grads.renderOrder = 4;
  flaskGroup.add(glassBack, base, glassFront, grads);

  // Shadow under the flask. The tray's top is at y = 0.1, so these sit just above it (they were
  // exactly on it before and got hidden). The light comes from the upper left, so the soft shadow
  // falls back and to the right, with a tight dark line where the glass touches the tray.
  const CS = 3.4, csPx = 256, toPx = (u) => (u / CS + 0.5) * csPx;
  const shadowDx = 0.2, shadowDz = -0.22;   // world units, away from the light
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(CS, CS), new THREE.MeshBasicMaterial({
    map: canvasTex(csPx, csPx, (ctx) => {
      const cx = toPx(shadowDx), cy = toPx(-shadowDz);   // canvas y runs toward the viewer (+z)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, toPx(1.45) - csPx / 2);
      g.addColorStop(0, "rgba(8,12,26,0.4)"); g.addColorStop(0.55, "rgba(8,12,26,0.25)"); g.addColorStop(1, "rgba(8,12,26,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, csPx, csPx);
      // contact line right at the rim of the base
      const c0 = csPx / 2, rim = toPx(1.0) - c0;
      const g2 = ctx.createRadialGradient(c0, c0, rim * 0.86, c0, c0, rim * 1.07);
      g2.addColorStop(0, "rgba(8,12,26,0)"); g2.addColorStop(0.62, "rgba(8,12,26,0.42)"); g2.addColorStop(1, "rgba(8,12,26,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, csPx, csPx);
    }), transparent: true, depthWrite: false,
  }));
  cs.rotation.x = -Math.PI / 2; cs.position.y = 0.104; cs.renderOrder = 1;
  // light focused through the glass and liquid: a soft bright patch inside the shadow, tinted by the liquid
  const caustic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({
    map: canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.4, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.16, color: "#fff7e8",
  }));
  caustic.rotation.x = -Math.PI / 2; caustic.position.set(0.42, 0.106, -0.36); caustic.renderOrder = 1;
  scene.add(cs, caustic);

  // ───────── Liquid: see-through, tinted by distance like real colored water ─────────
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: "#e6f3ff", roughness: 0.04, transparent: true, opacity: 0.42, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, emissive: "#000000",
  });
  // the liquid's color moves in as a front from the surface downward, like dye spreading through water
  const mixU = {
    uOld: { value: new THREE.Color("#e6f3ff") }, uNew: { value: new THREE.Color("#e6f3ff") },
    uOldA: { value: 0.42 }, uNewA: { value: 0.42 }, uFront: { value: -10 }, uSoft: { value: 0.22 },
  };
  liquidMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mixU);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vLY;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLY = position.y;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vLY;\nuniform vec3 uOld; uniform vec3 uNew; uniform float uOldA; uniform float uNewA; uniform float uFront; uniform float uSoft;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float mk = smoothstep(uFront - uSoft, uFront + uSoft, vLY);
        diffuseColor.rgb = mix(uOld, uNew, mk);
        diffuseColor.a = mix(uOldA, uNewA, mk);`);
  };
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
  let cloudNow = 0.04, cloudTo = 0.04;
  // one color change at a time sweeps down the liquid; later ones wait their turn
  let mixJob = null;
  const dyeList = [];
  const mixQueue = [];
  function mixTo(hex, alpha, dur) {
    mixQueue.push({ color: new THREE.Color(hex), alpha, dur });
  }
  function stepMix(dt) {
    if (!mixJob && mixQueue.length) {
      const j = mixQueue.shift();
      mixU.uNew.value.copy(j.color); mixU.uNewA.value = j.alpha;
      mixJob = { t: 0, dur: j.dur };
    }
    if (!mixJob) return false;
    mixJob.t += dt;
    const top = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);
    const k = ease(clamp01(mixJob.t / mixJob.dur));
    mixU.uFront.value = top + 0.3 - k * (top - BOTTOM_Y + 0.75);
    if (mixJob.t >= mixJob.dur) {
      mixU.uOld.value.copy(mixU.uNew.value); mixU.uOldA.value = mixU.uNewA.value; mixU.uFront.value = -10;
      mixJob = null;
    }
    return true;
  }

  // ───────── Streams: every pour is one continuous stream. It runs out of the mouth, its front falls
  // into the flask, and when the pour stops the tail lets go of the bottle and drops in after it. ─────────
  const flows = [];
  const _fp = new THREE.Vector3();
  function startFlow({ color, opacity = 0.92, thick = 0.03, gloss = 1, grain = 0, wobble = 0.05 }) {
    const tube = makeFlowTube(72, 12);
    const mat = flowMaterial({ color, opacity, gloss, grain });
    const mesh = new THREE.Mesh(tube.geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.visible = false;
    scene.add(mesh);
    const pts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const curve = new THREE.CatmullRomCurve3(pts);
    const f = {
      head: 0, tail: 0, hv: 1.4, tv: 0, age: 0, stopped: false, hit: false, done: false, len: 1,
      // mouth of the bottle → over the neck → down to the liquid surface (world space)
      aim(mouth, surfaceY) {
        const neck = pts[2].set(0, NECK_Y + lift + 0.05, 0);
        pts[0].copy(mouth);
        pts[1].set((mouth.x + neck.x) * 0.5, Math.max(mouth.y, neck.y) + 0.06, (mouth.z + neck.z) * 0.5);
        if (Math.hypot(mouth.x, mouth.z) < 0.15) pts[1].lerpVectors(mouth, neck, 0.5);   // straight above: just fall
        pts[3].set(0, surfaceY, 0);
        curve.needsUpdate = true;
        f.len = curve.getLength();
      },
      stop() { f.stopped = true; },
      step(dt, t) {
        f.age += dt;
        // the front accelerates as it falls; so does the tail once the pour ends
        if (f.head < 1) { f.hv += 9.8 * dt; f.head = Math.min(1, f.head + (f.hv * dt) / f.len); }
        else f.hit = true;
        if (f.stopped) { f.tv += 9.8 * dt; f.tail = Math.min(1, f.tail + ((0.6 + f.tv) * dt) / f.len); }
        if (f.tail >= 0.999) { f.done = true; mesh.visible = false; return; }
        const span = f.head - f.tail;
        mesh.visible = span > 0.003;
        if (!mesh.visible) return;
        const ramp = Math.min(1, f.age / 0.12);
        const cap = Math.min(0.05, span * 0.5);
        tube.update((u, out) => curve.getPointAt(u, out), f.tail, f.head, (u) => {
          // thins as it speeds up falling, with small ripples running down it
          let r = (thick * ramp) / Math.sqrt(1 + 2.6 * u);
          r *= 1 + wobble * Math.sin(u * f.len * 22 - t * 19);
          // rounded front and back ends
          const e = Math.min((f.head - u) / cap, (u - f.tail) / cap + (f.tail === 0 ? 1 : 0), 1);
          return r * Math.sqrt(Math.max(0, e));
        }, f.len);
        mat.uniforms.uTime.value = t;
      },
      dispose() { scene.remove(mesh); tube.geo.dispose(); mat.dispose(); },
    };
    flows.push(f);
    return f;
  }
  function stepFlows(dt, t) {
    for (let i = flows.length - 1; i >= 0; i--) {
      flows[i].step(dt, t);
      if (flows[i].done) { flows[i].dispose(); flows.splice(i, 1); }
    }
    return flows.length > 0;
  }

  // ripples where a stream meets the liquid
  const rippleTex = canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 40, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.55, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
  const ripples = [0, 0.5].map((phase) => {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rippleTex, transparent: true, depthWrite: false, opacity: 0 }));
    r.rotation.x = -Math.PI / 2; r.renderOrder = 2.6; r.visible = false; r.userData.phase = phase;
    flaskGroup.add(r);
    return r;
  });

  // ───────── Dye and yeast spreading through the water: soft curling plumes that sink from where the
  // stream lands, widen, and fade as the color mixes in ─────────
  const plumes = [];
  function startPlume(color, { opacity = 0.6, phase = 0, swirl = 1, width = 1, life = 3.4 } = {}) {
    const tube = makeFlowTube(48, 10);
    const mat = flowMaterial({ color, opacity, plume: 1 });
    const mesh = new THREE.Mesh(tube.geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 2.5;
    flaskGroup.add(mesh);
    plumes.push({ tube, mat, mesh, age: 0, phase, swirl, width, life, opacity });
  }
  function stepPlumes(dt, t) {
    const surf = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);
    for (let i = plumes.length - 1; i >= 0; i--) {
      const p = plumes[i];
      p.age += dt;
      const head = ease(clamp01(p.age / 1.9));
      const spread = 1 - Math.pow(1 - clamp01(p.age / 2.6), 2);
      const depth = surf - BOTTOM_Y - 0.1;
      const at = (u, out) => {
        const y = surf - 0.03 - u * depth;
        const ang = p.phase + p.swirl * (u * 4.2 + spread * 1.2);
        const rad = Math.min(0.04 + u * 0.34 * p.width, Math.max(0.02, innerR(y) - 0.2));
        return out.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      };
      p.tube.update(at, 0, Math.max(0.02, head), (u) => {
        const end = Math.min(1, (head - u) / 0.12);
        return (0.035 + 0.21 * u * p.width) * (0.45 + 0.55 * spread) * Math.sqrt(Math.max(0, end)) + 0.004;
      }, 1);
      p.mat.uniforms.uTime.value = t;
      p.mat.uniforms.uOpacity.value = p.opacity * Math.min(1, p.age * 5) * (1 - smoothstep(p.life * 0.5, p.life, p.age));
      if (p.age >= p.life) { flaskGroup.remove(p.mesh); p.tube.geo.dispose(); p.mat.dispose(); plumes.splice(i, 1); }
    }
    return plumes.length > 0;
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
  const quality = adaptiveQuality(renderer, () => { framesLeft = 2; }, { max: 1.5 });
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
    cloudNow += (cloudTo - cloudNow) * Math.min(1, dt * 2);
    liquidMat.roughness = cloudNow;
    liquidMat.emissive.copy(mixU.uNew.value).multiplyScalar(0.1);
    const mixing = stepMix(dt);
    const flowing = stepFlows(dt, t);
    const pluming = stepPlumes(dt, t);

    const top = BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y);

    // rings spread out where a stream is hitting the surface
    const splashing = flows.some((f) => f.hit && f.tail < 0.97) && levelNow > 0.02;
    for (const r of ripples) {
      r.visible = splashing;
      if (!splashing) continue;
      const k = (t * 1.6 + r.userData.phase) % 1;
      r.position.set(0, top + 0.004, 0);
      r.scale.setScalar(0.12 + k * Math.min(0.7, (innerR(top) - 0.02) * 1.6));
      r.material.opacity = 0.45 * (1 - k);
    }
    // the bright patch under the flask picks up the liquid's color
    caustic.material.color.copy(mixU.uOld.value).lerp(mixU.uNew.value, 0.5).lerp(col.set("#fff7e8"), 0.35);
    caustic.material.opacity = 0.08 + levelNow * 0.14;

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
    const busy = pourJob || foamT >= 0 || mixing || flowing || pluming || soapy || Math.abs(levelTo - levelNow) > 0.0005 || fizz > 1 ||
      camera.position.distanceToSquared(lastCam) > 1e-6 || framesLeft > 0;
    if (busy) {
      if (pourJob || foamT >= 0) renderer.shadowMap.needsUpdate = true;
      quality.frame(performance.now()); renderer.render(scene, camera);
      lastCam.copy(camera.position);
      if (framesLeft > 0) framesLeft--;
    } else quality.reset();
    raf = requestAnimationFrame(loop);
  }
  buildLiquid(0);
  loop();

  // a bottle swings in, tips over the neck, pours a curved stream, and swings back out
  const STREAM_COLOR = { peroxide: "#eaf6ff", soap: "#f2c230", yeast: "#c79a5c" };
  function pour(kind, color, toLevel) {
    if (kind === "yeast") return dropPacket(toLevel);
    if (kind === "dye") return dripDye(color, toLevel);
    return new Promise((resolve) => {
      if (reducedMotion) { levelTo = toLevel; resolve(); return; }
      const bottle = makeBottle(kind, color);
      bottle.rotation.y = -0.5;
      scene.add(bottle);
      const from = new THREE.Vector3(3.6, 3.4, 0.4), at = new THREE.Vector3(0.5, NECK_Y + lift + 0.42, 0.05);
      const tilt = 2.05;
      let time = 0, flow = null;
      const mouth = new THREE.Vector3();
      pourJob = {
        step(dt) {
          time += dt;
          const tIn = ease(clamp01(time / 0.55));
          const tTip = ease(clamp01((time - 0.4) / 0.4));
          const tBack = ease(clamp01((time - 1.7) / 0.5));
          bottle.position.lerpVectors(from, at, tIn);
          if (tBack > 0) bottle.position.lerpVectors(at, from, tBack);
          bottle.rotation.z = tilt * (tTip - tBack) + 0.25 * tIn;
          if (!flow && time > 0.72) {
            flow = kind === "peroxide"
              ? startFlow({ color: "#dcecff", opacity: 0.42, thick: 0.042, gloss: 1, wobble: 0.04 })
              : startFlow({ color: STREAM_COLOR.soap, opacity: 0.95, thick: 0.03, gloss: 0.85, wobble: 0.03 });
          }
          if (flow) {
            if (time > 1.72) flow.stop();
            bottle.updateMatrixWorld();
            mouth.set(0, 0, 0).applyMatrix4(bottle.matrixWorld);
            if (!flow.stopped) flow.aim(mouth, surfaceWorld());
            if (flow.hit) levelTo = toLevel;
          }
          if (time > 2.25 && (!flow || flow.done)) {
            scene.remove(bottle);
            bottle.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); } });
            pourJob = null;
            levelTo = toLevel;
            resolve();
          }
        },
      };
    });
  }
  const surfaceWorld = () => Math.max(BOTTOM_Y + 0.02, BOTTOM_Y + levelNow * (FULL_Y - BOTTOM_Y)) + lift;

  // the dropper tips over the neck and squeezes out three drops, which fall in and bloom
  function dripDye(hex, toLevel) {
    return new Promise((resolve) => {
      if (reducedMotion) { levelTo = toLevel; resolve(); return; }
      const bottle = makeBottle("dye", hex);
      bottle.rotation.y = -0.5;
      scene.add(bottle);
      const from = new THREE.Vector3(3.6, 3.4, 0.4), at = new THREE.Vector3(0.02, NECK_Y + lift + 0.75, 0.02);
      const mouth = new THREE.Vector3();
      let time = 0, flow = null, landed = false;
      pourJob = {
        step(dt) {
          time += dt;
          const tIn = ease(clamp01(time / 0.55));
          const tTip = ease(clamp01((time - 0.35) / 0.35));
          const tBack = ease(clamp01((time - 1.55) / 0.5));
          bottle.position.lerpVectors(from, at, tIn);
          if (tBack > 0) bottle.position.lerpVectors(at, from, tBack);
          bottle.rotation.z = Math.PI * (tTip - tBack) + 0.25 * tIn * (1 - tTip);
          // squeezed the whole time the dye is running
          const squeeze = time > 0.72 && time < 1.42 ? 1 : 0;
          bottle.scale.set(1 + 0.1 * squeeze, 1 - 0.07 * squeeze, 1 + 0.1 * squeeze);
          if (!flow && time > 0.75) flow = startFlow({ color: hex, opacity: 0.96, thick: 0.013, gloss: 0.75, wobble: 0.06 });
          if (flow) {
            if (time > 1.4) flow.stop();
            bottle.updateMatrixWorld();
            mouth.set(0, 0, 0).applyMatrix4(bottle.matrixWorld);
            if (!flow.stopped) flow.aim(mouth, surfaceWorld());
            if (flow.hit && !landed) {
              landed = true;
              levelTo = toLevel;
              const ph = Math.random() * Math.PI * 2;
              startPlume(hex, { opacity: 0.62, phase: ph, swirl: 1, width: 1 });
              startPlume(hex, { opacity: 0.45, phase: ph + 2.6, swirl: -0.8, width: 0.7, life: 3 });
              dyeList.push(hex);
              const blend = new THREE.Color(dyeList[0]);
              dyeList.slice(1).forEach((c) => blend.lerp(new THREE.Color(c), 0.45));
              mixTo("#" + blend.getHexString(), 0.93, 2.6);
            }
          }
          if (time > 2.1 && (!flow || flow.done)) {
            scene.remove(bottle);
            bottle.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); } });
            pourJob = null;
            levelTo = toLevel;
            resolve();
          }
        },
      };
    });
  }

  // the yeast packet flies in, tears open at the corner, tips over the neck and pours its granules
  function dropPacket(toLevel) {
    return new Promise((resolve) => {
      if (reducedMotion) { levelTo = toLevel; resolve(); return; }
      const { group: packet, flap } = makePacket();
      packet.rotation.y = -0.35;
      scene.add(packet);
      const from = new THREE.Vector3(3.4, 3.8, 0.4), at = new THREE.Vector3(0.04, NECK_Y + lift + 0.42, 0.03);
      const mouth = new THREE.Vector3();
      const flapV = new THREE.Vector3(0.9, 1.6, 0.4);
      let time = 0, flow = null, landed = false;
      pourJob = {
        step(dt) {
          time += dt;
          const tIn = ease(clamp01(time / 0.6));
          const tTip = ease(clamp01((time - 0.95) / 0.45));
          const tBack = ease(clamp01((time - 2.6) / 0.5));
          packet.position.lerpVectors(from, at, tIn);
          if (tBack > 0) packet.position.lerpVectors(at, from, tBack);
          // tear: the corner strip rips off and flutters away
          if (time > 0.62) {
            flap.visible = time < 1.6;
            const ft = time - 0.62;
            flap.position.set(flapV.x * ft, flapV.y * ft - 2.4 * ft * ft, flapV.z * ft);
            flap.rotation.set(ft * 5, ft * 3, ft * 7);
          }
          const shake = time > 1.4 && time < 2.5 ? Math.sin(time * 38) * 0.06 : 0;
          packet.rotation.z = -0.15 * tIn * (1 - tTip) + 2.35 * (tTip - tBack) + shake;
          if (!flow && time > 1.3) flow = startFlow({ color: "#c4934f", opacity: 1, thick: 0.024, gloss: 0, grain: 1, wobble: 0.14 });
          if (flow) {
            if (time > 2.55) flow.stop();
            packet.updateMatrixWorld();
            mouth.set(0, 0, 0).applyMatrix4(packet.matrixWorld);
            if (!flow.stopped) flow.aim(mouth, surfaceWorld());
            if (flow.hit && !landed) {
              landed = true;
              levelTo = toLevel;
              const ph = Math.random() * Math.PI * 2;
              startPlume("#b98a4e", { opacity: 0.4, phase: ph, swirl: 0.7, width: 1.1, life: 3.6 });
              startPlume("#d9b98a", { opacity: 0.3, phase: ph + 3, swirl: -0.6, width: 0.8, life: 3.2 });
            }
          }
          if (time > 3.15 && (!flow || flow.done)) {
            scene.remove(packet);
            packet.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach((mm) => { mm.map?.dispose(); mm.dispose(); }); } });
            pourJob = null;
            levelTo = toLevel;
            resolve();
          }
        },
      };
    });
  }

  return {
    pour,
    // the drops already started the color sweep; a later color blends with the first
    addDye(hex, all) {
      if (!reducedMotion) return;
      const blend = new THREE.Color(all[0]);
      all.slice(1).forEach((c) => blend.lerp(new THREE.Color(c), 0.45));
      mixTo("#" + blend.getHexString(), 0.93, 0.01);
    },
    setSoap(on) { soapy = on; cloudTo = on ? 0.16 : 0.04; if (on) mixTo("#f1f6e2", 0.55, reducedMotion ? 0.01 : 1.4); },
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
      cloudTo = 0.04; mixQueue.length = 0; mixJob = null;
      mixU.uOld.value.set("#e6f3ff"); mixU.uNew.value.set("#e6f3ff"); mixU.uOldA.value = mixU.uNewA.value = 0.42; mixU.uFront.value = -10;
      dyeList.length = 0;
      flows.forEach((f) => f.dispose()); flows.length = 0;
      plumes.forEach((p) => { flaskGroup.remove(p.mesh); p.tube.geo.dispose(); p.mat.dispose(); }); plumes.length = 0;
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
