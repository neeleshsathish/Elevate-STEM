import { PARTNERS, DISCORD } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";
import JoinBand from "../components/JoinBand.jsx";

const CARD_COLORS = ["#c6efb8", "#bfd3f6", "#f7e7d8", "#b9e6d3", "#cdd8fb", "#eedfc8"];

const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
);

export default function Partners() {
  return (
    <>
      <PageIntro title="Partners" kicker="20+ partner organizations" scene="partners">
        We team up with student-run organizations whose work helps students learn, compete, and do research.
      </PageIntro>

      <section className="section">
        <div className="wrap">
          <p className="partner-note is-top" data-reveal="up">
            <span className="partner-note-dot" aria-hidden="true" />
            These are just a few of our partners. We work with 20+ organizations and we&rsquo;ll be adding the rest here soon.
          </p>
          <ul className="partner-cards">
            {PARTNERS.map((p, i) => (
              <li
                key={p.name}
                data-reveal="up"
                data-tilt
                style={{ "--d": i % 3, "--card": CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <span className="partner-mono" aria-hidden="true">{p.name.replace(/[^A-Za-z]/g, "")[0]}</span>
                <h2>{p.name}</h2>
                <p>{p.blurb}</p>
                <div className="partner-links">
                  {p.links.map((l) => (
                    <a key={l.href} className="pill-link" href={l.href} target="_blank" rel="noreferrer">
                      {l.label}
                      <ExternalIcon />
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinBand
        title="Want to partner with us?"
        text="If your organization helps students with STEM, we'd love to work together."
        cta="Reach out on Discord"
        href={DISCORD}
      />
    </>
  );
}
