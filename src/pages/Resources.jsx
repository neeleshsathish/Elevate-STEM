import { useState } from "react";
import { GUIDES, guideCover } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";
import GuideSheet from "../components/GuideSheet.jsx";

const TAGS = ["All", ...new Set(GUIDES.map((g) => g.tag))];
const HERO_COVERS = ["pathway-to-research", "research-paper-guide", "cold-email-template"]
  .map((slug) => guideCover(GUIDES.find((g) => g.slug === slug)));

export default function Resources() {
  const [tag, setTag] = useState("All");
  const shown = tag === "All" ? GUIDES : GUIDES.filter((g) => g.tag === tag);

  return (
    <>
      <PageIntro title="Free guides" kicker={`${GUIDES.length} free guides`} scene="guides" covers={HERO_COVERS}>
        Guides and templates for research, outreach, college applications, and science fairs.
        Click any guide to read it here, or download it to fill in.
      </PageIntro>

      <section className="section">
        <div className="wrap">
          <div className="filters" role="group" aria-label="Filter guides by topic">
            {TAGS.map((t) => (
              <button
                key={t}
                className={`filter${tag === t ? " is-active" : ""}`}
                aria-pressed={tag === t}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="sheet-grid sheet-grid-wide">
            {shown.map((g, i) => (
              <GuideSheet key={g.slug} guide={g} headingLevel="h2" index={i % 3} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
