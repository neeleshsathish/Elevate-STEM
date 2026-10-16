import { DONATE_URL, DISCORD, asset } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";
import SplitWords from "../motion/SplitWords.jsx";
import { scrollToElement } from "../motion/smoothScroll.js";

const TIERS = [
  { amount: "$10", text: "A basic science kit for one child", color: "#c6efb8" },
  { amount: "$25", text: "Coding supplies for a small classroom activity", color: "#bfd3f6" },
  { amount: "$50", text: "A full STEM kit for one student", color: "#f7e7d8" },
  { amount: "$100", text: "Hands-on materials for a whole group", color: "#b9e6d3" },
];

const KIT_PHOTOS = [
  { src: "impact/kit-contents.webp", caption: "Inside one kit: a motor, fan, bulb, switch, and wires for building circuits", r: 0.84 },
  { src: "impact/school-visit.webp", caption: "Handing out kits to students on a school visit", r: 1.32 },
  { src: "impact/kits-box.webp", caption: "A box of kits packed and ready to send", r: 0.7 },
];

export default function Donate() {
  return (
    <>
      <PageIntro
        title="Send STEM kits to kids who need them"
        kicker="100+ STEM kits donated"
        scene="donate"
        actions={
          <>
            <a className="btn btn-white" href={DONATE_URL} target="_blank" rel="noreferrer">Donate now</a>
            <button className="btn btn-glass" type="button" onClick={() => scrollToElement(document.getElementById("kits"))}>
              See what's in a kit
            </button>
          </>
        }
      >
        Millions of kids grow up without basic science or coding tools. We've donated 100+ STEM kits
        so far, and every donation sends more to communities that need them.
      </PageIntro>

      <section className="section">
        <div className="wrap donate-grid">
          <div>
            <SplitWords>What your donation does</SplitWords>
            <ul className="tier-cards">
              {TIERS.map((t, i) => (
                <li key={t.amount} data-reveal="up" data-tilt style={{ "--d": i + 1, "--card": t.color }}>
                  <span className="tier-amount">{t.amount}</span>
                  <span className="tier-text">{t.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="donate-box" data-reveal="up" style={{ "--d": 2 }}>
            <h2>Donate through Hack Club</h2>
            <p>
              Donations are processed by Hack Club, a 501(c)(3) fiscal sponsor for student-led
              nonprofits, so your gift may be tax-deductible.
            </p>
            <a className="btn btn-highlight" href={DONATE_URL} target="_blank" rel="noreferrer">Donate now</a>
            <p className="small">
              Questions? Ask us on <a href={DISCORD} target="_blank" rel="noreferrer">Discord</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="section kits-section" id="kits">
        <div className="wrap">
          <div className="section-head-row">
            <SplitWords>What's inside a kit</SplitWords>
            <p className="section-note" data-reveal="up" style={{ "--d": 2 }}>
              Each kit has everything a student needs to build working circuits at home or in class.
            </p>
          </div>
          <div className="kit-photos">
            {KIT_PHOTOS.map((p, i) => (
              <figure key={p.src} data-reveal="up" style={{ "--d": i, "--r": p.r }}>
                <div className="fr fr-photo"><img src={asset(p.src)} alt={p.caption} loading="lazy" /></div>
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
