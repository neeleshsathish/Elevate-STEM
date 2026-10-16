import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into /docs so GitHub Pages can serve it straight from the main branch.
export default defineConfig({
  plugins: [react()],
  // "./" makes the built site work at any address: a github.io link, a subfolder, or your own domain
  base: process.env.VITE_BASE || "./",
  build: { outDir: "docs", emptyOutDir: true },
});
