// After the normal build: put the pre-rendered homepage into docs/index.html, mark the hero's
// entrance animations as already running (so they start on first paint, no JS needed), and
// inline the stylesheet so the first paint doesn't wait for a second file.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { render } = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
let app = render("/");

// the hero is on screen at load: start its reveal animations straight away
const heroStart = app.indexOf('<section class="sky-hero');
const heroEnd = app.indexOf("</section>", heroStart);
if (heroStart >= 0 && heroEnd > heroStart) {
  const hero = app.slice(heroStart, heroEnd).replace(/(<[a-z0-9]+)([^>]*?)class="([^"]*)"([^>]*?data-reveal=)/g, "$1$2class=\"$3 is-revealed\"$4")
    .replace(/(<[a-z0-9]+)((?:(?!class=)[^>])*?data-reveal="[^"]*")((?:(?!class=)[^>])*>)/g, "$1 class=\"is-revealed\"$2$3");
  app = app.slice(0, heroStart) + hero + app.slice(heroEnd);
}

let html = readFileSync("docs/index.html", "utf8");
html = html.replace('<div id="root"></div>', `<div id="root">${app}</div>`);

// inline the main stylesheet (its font urls are relative to assets/, so point them there)
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/index-[^"]+\.css)">/, (_, href) => {
  const css = readFileSync(`docs/${href}`, "utf8").replace(/url\(\.\//g, "url(./assets/");
  return `<style>${css}</style>`;
});
writeFileSync("docs/index.html", html);
rmSync("dist-ssr", { recursive: true, force: true });
console.log(`Pre-rendered homepage (${Math.round(app.length / 1024)} KB of HTML)`);
