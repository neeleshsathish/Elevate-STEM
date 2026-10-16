import { TEAM, DISCORD, INSTAGRAM, asset } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";
import JoinBand from "../components/JoinBand.jsx";
import SplitWords from "../motion/SplitWords.jsx";

const CARD_COLORS = ["#c6efb8", "#bfd3f6", "#f7e7d8", "#b9e6d3"];

export default function Team() {
  return (
    <>
      <PageIntro title="Our team" kicker="Who we are" scene="team">
        Elevate STEM is founded and run by students who want the next generation to have an easier
        path into STEM than they did.
      </PageIntro>

      <section className="section">
        <div className="wrap">
          <div className="section-head-row">
            <SplitWords>The founders</SplitWords>
          </div>
          <div className="team-grid">
            {TEAM.map((m, i) => (
              <article
                key={m.name}
                className="person-card"
                data-reveal="up"
                data-tilt
                style={{ "--d": i, "--card": CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <div className="person-avatar">
                  <span className="avatar-ring" aria-hidden="true" />
                  {m.photo ? (
                    <img src={asset(m.photo)} alt={m.name} />
                  ) : (
                    <span className="avatar-initials" aria-hidden="true">{m.initials}</span>
                  )}
                </div>
                <h3>{m.name}</h3>
                <p className="person-role">{m.role}</p>
                <p className="person-bio">{m.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <JoinBand
        title="Want to help run Elevate STEM?"
        text="We're always looking for students to help with workshops, guides, and outreach."
        cta="Say hi in the Discord"
        href={DISCORD}
        secondary={{ label: "Follow on Instagram", href: INSTAGRAM }}
      />
    </>
  );
}
