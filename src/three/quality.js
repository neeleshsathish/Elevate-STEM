// Keeps a 3D scene smooth on slower devices: it watches how long frames take, and if the device is
// struggling it lowers the scene's resolution a step at a time (fast devices keep full sharpness).
export function startPixelRatio(max = 1.5) {
  return Math.min(window.devicePixelRatio || 1, max);
}

export function adaptiveQuality(renderer, onChange, { max = 1.5, min = 0.6 } = {}) {
  let pr = startPixelRatio(max);
  renderer.setPixelRatio(pr);
  let last = 0, ema = 16, frames = 0, settled = false;
  return {
    // call once per drawn frame with the rAF timestamp
    frame(now) {
      if (settled) return;
      if (last) {
        const d = Math.min(now - last, 100);
        ema = ema * 0.9 + d * 0.1;
        frames++;
      }
      last = now;
      if (frames < 45) return;
      frames = 0;
      if (ema > 22 && pr > min) {
        pr = Math.max(min, Math.round((pr - 0.25) * 100) / 100);
        renderer.setPixelRatio(pr);
        onChange();
      } else if (ema <= 22) {
        settled = true;   // running smoothly: stop checking
      }
    },
    // a pause (scrolled away, tab hidden) shouldn't count as a slow frame
    reset() { last = 0; },
  };
}

// True when the device has no real graphics chip (the browser is drawing 3D on the processor).
// There the 3D would make the whole page lag, so those visitors get the lighter, non-3D version.
let softwareGL = null;
export function isSoftwareGL() {
  if (softwareGL !== null) return softwareGL;
  // ?force3d in the address turns the 3D on regardless (handy for testing)
  if (/[?&]force3d\b/.test(window.location.search)) return (softwareGL = false);
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return (softwareGL = true);
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    softwareGL = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(name);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    softwareGL = true;
  }
  return softwareGL;
}
