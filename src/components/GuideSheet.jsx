import { Link } from "react-router-dom";
import { guideCover } from "../data.js";

// A guide shown as its actual first page, like a sheet of paper. Click to open the reader.
export default function GuideSheet({ guide, headingLevel = "h3", index = 0 }) {
  const H = headingLevel;
  return (
    <Link to={`/resources/${guide.slug}`} className="sheet-link" data-reveal="up" style={{ "--d": index % 4 }}>
      <span className="sheet-frame" data-tilt>
        <img
          className="sheet-img"
          src={guideCover(guide)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="sheet-open" aria-hidden="true">Read now</span>
      </span>
      <span className="sheet-meta">
        <span className="sheet-tag">{guide.tag}</span>
        <span className="sheet-pages">{guide.pages} {guide.pages === 1 ? "page" : "pages"}</span>
      </span>
      <H className="sheet-title">{guide.title}</H>
      <span className="sheet-blurb">{guide.blurb}</span>
    </Link>
  );
}
