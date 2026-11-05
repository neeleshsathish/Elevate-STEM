import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource-variable/figtree/wght-italic.css";
import "./styles.css";
import { startSmoothScroll } from "./motion/smoothScroll.js";
import { startInteractions } from "./motion/interactions.js";

startInteractions();
startSmoothScroll();

// If the site was updated while this tab was open, a page section may ask for a file from the old
// version that no longer exists. Reload once to pick up the new version instead of breaking.
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  try {
    if (sessionStorage.getItem("es-reloaded")) return;
    sessionStorage.setItem("es-reloaded", "1");
  } catch { /* storage blocked: still reload */ }
  window.location.reload();
});
window.addEventListener("load", () => setTimeout(() => { try { sessionStorage.removeItem("es-reloaded"); } catch { /* ignore */ } }, 10000));

// HashRouter is only used for preview builds hosted somewhere without 404 fallback.
// Links look like /#/team so every page works on GitHub Pages at any address, with no server setup.
// Set VITE_BROWSER_ROUTER=1 at build time for plain /team links (only when hosted at a domain root).
const Router = import.meta.env.VITE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

const app = (
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
// The homepage comes pre-rendered in the HTML: attach to it. Any other page builds fresh.
const root = document.getElementById("root");
const route = window.location.hash.replace(/^#/, "");
const atHome = !route.startsWith("/") || route === "/";
if (root.firstElementChild && atHome) {
  hydrateRoot(root, app);
} else {
  root.textContent = "";
  createRoot(root).render(app);
}
document.documentElement.classList.remove("pr-skip");
