import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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

// HashRouter is only used for preview builds hosted somewhere without 404 fallback.
// Links look like /#/team so every page works on GitHub Pages at any address, with no server setup.
// Set VITE_BROWSER_ROUTER=1 at build time for plain /team links (only when hosted at a domain root).
const Router = import.meta.env.VITE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
