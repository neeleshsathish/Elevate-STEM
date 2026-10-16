import { asset } from "../data.js";

// The Elevate STEM logo (the blue-to-green square) next to the name.
export default function Logo({ light = false }) {
  return (
    <span className={`logo${light ? " logo-light" : ""}`}>
      <img className="logo-img" src={asset("brand/logo-256.webp")} alt="" width="38" height="38" />
      <span className="logo-word">Elevate STEM</span>
    </span>
  );
}
