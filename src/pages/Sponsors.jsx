import { DISCORD, STATS } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";
import JoinBand from "../components/JoinBand.jsx";
import SplitWords from "../motion/SplitWords.jsx";
import CountUp from "../motion/CountUp.jsx";

const ICONS = {
  guides: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="18" y="10" width="30" height="40" rx="4" />
      <rect x="12" y="15" width="30" height="40" rx="4" />
      <path d="M19 26h16M19 33h16M19 40h10" />
    </svg>
  ),
  kits: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="22" width="44" height="30" rx="5" />
      <path d="M10 30h44M26 22v-6h12v6" />
      <circle cx="22" cy="41" r="4" /><path d="M34 38h12M34 44h8" />
    </svg>
  ),
  workshops: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="12" width="48" height="30" rx="5" />
      <circle cx="32" cy="25" r="6" /><path d="M22 38c2-5 6-7 10-7s8 2 10 7M24 52h16M32 42v10" />
    </svg>
  ),
};

const WHAT_IT_FUNDS = [
  { icon: "guides", title: "Free resources", text: "New guides and templates, kept free for every student.", color: "#c6efb8" },
  { icon: "kits", title: "STEM kits", text: "Science kits and coding tools for kids who don't have access to them.", color: "#f7e7d8" },
  { icon: "workshops", title: "Workshops", text: "Live sessions with researchers and college students, open to everyone.", color: "#bfd3f6" },
];

export default function Sponsors() {
  return (
    <>
      <PageIntro title="Sponsor Elevate STEM" kicker="Support student science" scene="sponsors">
        Sponsors keep our guides, kits, and workshops free. Your support puts your organization
        in front of more than a thousand students who are serious about STEM.
      </PageIntro>

      <section className="section">
        <div className="wrap">
          <div className="section-head-row">
            <SplitWords>What sponsorship pays for</SplitWords>
            <p className="section-note" data-reveal="up" style={{ "--d": 2 }}>Every dollar goes to programs for students.</p>
          </div>
          <ul className="fund-cards">
            {WHAT_IT_FUNDS.map((f, i) => (
              <li key={f.title} data-reveal="up" data-tilt style={{ "--d": i, "--card": f.color }}>
                <span className="fund-icon">{ICONS[f.icon]}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sky-band">
        <div className="intro-clouds" aria-hidden="true">
          <span className="cloud c1" /><span className="cloud c3" />
        </div>
        <div className="wrap">
          <SplitWords>Who you'll reach</SplitWords>
          <dl className="sky-stats" data-reveal="up" style={{ "--d": 2 }}>
            {STATS.map((s, i) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd><CountUp value={s.value} delay={0.2 + i * 0.12} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <JoinBand
        title="Interested in sponsoring?"
        text="Message our team on Discord and we'll put together a package that fits."
        cta="Contact us on Discord"
        href={DISCORD}
      />
    </>
  );
}
