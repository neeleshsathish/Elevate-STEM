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
