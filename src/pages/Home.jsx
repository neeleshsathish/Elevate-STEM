import { Link } from "react-router-dom";
import { DISCORD, INSTAGRAM, GUIDES, PARTNERS } from "../data.js";
import GuideSheet from "../components/GuideSheet.jsx";
import ImpactSlider from "../components/ImpactSlider.jsx";
import SkyHero from "../components/SkyHero.jsx";
import SplitWords from "../motion/SplitWords.jsx";
import JoinBand from "../components/JoinBand.jsx";

const PROGRAMS = [
  {
    title: "Free guides and templates",
    text: "Nine guides covering research papers, literature reviews, cold emails, grants, CVs, and science fair posters. Read them right on the site.",
    to: "/resources",
    cta: "Browse the guides",
    color: "#c6efb8",
  },
  {
    title: "Student community",
    text: "A 1,050+ member Discord where students find research partners, ask questions, and hear about opportunities first.",
    href: DISCORD,
    cta: "Join the Discord",
    color: "#cdd8fb",
  },
  {
    title: "Partner network",
    text: "We work with student-run nonprofits running tutoring, olympiads, AP help, and research projects.",
    to: "/partners",
    cta: "Meet our partners",
    color: "#bfd3f6",
  },
  {
    title: "STEM supplies drive",
    text: "We raise money for science kits and coding supplies for kids who don't have them. 100+ STEM kits donated so far.",
    to: "/donate",
    cta: "Support the drive",
    color: "#f7e7d8",
  },
];

function ProgramLink({ p }) {
  return p.to ? (
    <Link className="text-link" to={p.to}>{p.cta}</Link>
  ) : (
    <a className="text-link" href={p.href} target="_blank" rel="noreferrer">{p.cta}</a>
  );
}

// Two rows of partner names gliding in opposite directions. Pauses on hover.
function PartnerMarquee() {
  const rows = [PARTNERS, [...PARTNERS].reverse()];
  return (
    <div className="marquee" data-reveal="up" style={{ "--d": 2 }}>
      {rows.map((row, r) => (
        <div className={`marquee-row${r ? " is-reverse" : ""}`} key={r}>
          {[0, 1].map((copy) => (
            <ul className="marquee-track" key={copy} aria-hidden={copy === 1 || r === 1 ? "true" : undefined}>
              {row.map((p) => (
                <li key={p.name}>
                  <a
                    className="partner-pill"
                    href={p.links[0].href}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={copy === 1 || r === 1 ? -1 : undefined}
                  >
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SkyHero />

      <ImpactSlider />

      <section className="section section-tint">
        <div className="wrap split">
          <div className="split-head">
            <SplitWords>What we do</SplitWords>
            <p data-reveal="up" style={{ "--d": 2 }}>Everything is free and run by students. No sign-ups, no paywalls.</p>
          </div>
          <ul className="program-cards">
            {PROGRAMS.map((p, i) => (
              <li key={p.title} style={{ "--card": p.color, "--d": i }} data-reveal="up" data-tilt>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ProgramLink p={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head-row">
            <SplitWords>Start with a guide</SplitWords>
            <Link className="text-link" to="/resources">See all {GUIDES.length} guides</Link>
          </div>
          <div className="sheet-grid">
            {GUIDES.slice(0, 4).map((g, i) => (
              <GuideSheet key={g.slug} guide={g} index={i} />
            ))}
          </div>
        </div>
      </section>


      <section className="section section-tint">
        <div className="wrap">
          <div className="section-head-row">
            <SplitWords>Our partners</SplitWords>
            <Link className="text-link" to="/partners">About each partner</Link>
          </div>
        </div>
        <PartnerMarquee />
        <div className="wrap">
          <p className="partner-note" data-reveal="up" style={{ "--d": 3 }}>
            These are just a few of the 20+ organizations we work with. We&rsquo;ll be adding more soon.
          </p>
        </div>
      </section>

      <JoinBand
        title="Find people to build things with."
        text="Ask questions, find research partners, and hear about new opportunities first."
        cta="Join the Discord"
        href={DISCORD}
        secondary={{ label: "Follow on Instagram", href: INSTAGRAM }}
      />
    </>
  );
}
