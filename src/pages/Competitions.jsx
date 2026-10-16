import { COMPETITION as C, DISCORD } from "../data.js";
import PageIntro from "../components/PageIntro.jsx";

export default function Competitions() {
  const open = C.status === "open";
  return (
    <>
      <PageIntro title={C.name}>
        Our annual STEM project competition. Build something in science, technology, engineering,
        or math, alone or with up to three teammates, and compete for cash prizes.
      </PageIntro>

      <section className="section">
        <div className="wrap">
          <div className={`notice${open ? " notice-open" : ""}`} role="status">
            {open ? (
              <p><strong>Submissions are open.</strong> Send your project in with the form below.</p>
            ) : (
              <p>
                <strong>Submissions are closed.</strong> Judges are reviewing entries now. Results and the
                next competition will be announced in the{" "}
                <a href={DISCORD} target="_blank" rel="noreferrer">Discord</a>.
              </p>
            )}
          </div>

          <dl className="comp-facts comp-facts-wide">
            <div><dt>Prize pool</dt><dd>{C.prizePool}</dd></div>
            <div><dt>Team size</dt><dd>{C.teamSize}</dd></div>
            <div><dt>Entry fee</dt><dd>{C.entryFee}</dd></div>
          </dl>

          <div className="comp-grid">
            <div className="prose">
              <h2>How it works</h2>
              <p>
                {C.name} asks students to show creativity, problem-solving, and technical skill
                on a STEM project of their choice. You can enter on your own or as a team of up to four.
                Every entry gets written feedback from the judges in each scoring category.
              </p>

              <h2>Prizes</h2>
              <ol className="prize-list">
                {C.prizes.map((p) => (
                  <li key={p.place}>
                    <span className="prize-place">{p.place}</span>
                    <span className="prize-amount">{p.amount}</span>
                  </li>
                ))}
              </ol>

              {open ? (
                <a className="btn btn-ink" href={C.submitUrl} target="_blank" rel="noreferrer">Submit your project</a>
              ) : (
                <a className="btn btn-outline" href={DISCORD} target="_blank" rel="noreferrer">Get notified in the Discord</a>
              )}
            </div>

            <div className="rubric">
              <h2>How projects are scored</h2>
              <p className="small">
                Judges score each category from 1 (excellent) to 6 (poor). Each category's points
                are (7 − score) ÷ 6 × its weight.
              </p>
              <ul className="rubric-list">
                {C.rubric.map(([name, weight]) => (
                  <li key={name}>
                    <div className="rubric-row">
                      <span>{name}</span>
                      <span className="rubric-weight">{weight}%</span>
                    </div>
                    <span className="rubric-bar" style={{ "--w": `${weight * 4}%` }} />
                  </li>
                ))}
              </ul>
              <p className="small">Ties are broken by the impact &amp; contribution score.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
