// GitHub Pages serves 404.html for any path it doesn't know (like /resources/cv-template).
// Copying the app shell there means shared links and page refreshes open the right page
// instead of bouncing to the homepage.
import { copyFileSync } from "node:fs";

copyFileSync("docs/index.html", "docs/404.html");
console.log("Copied docs/index.html -> docs/404.html");
