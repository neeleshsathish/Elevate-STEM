// Used only at build time: renders the homepage to plain HTML so it shows up instantly,
// before any JavaScript has loaded. The browser then "hydrates" it (attaches the interactivity).
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

export function render(url = "/") {
  return renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}>
        <App />
      </MemoryRouter>
    </StrictMode>
  );
}
