import SplitWords from "../motion/SplitWords.jsx";

// The call-to-action band at the bottom of pages, in the logo's blue-to-green gradient,
// with a few glassy bubbles drifting behind it.
export default function JoinBand({ title, text, cta, href, secondary }) {
  return (
    <section className="join-band">
      <div className="join-bubbles" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <div className="wrap join-row">
        <SplitWords>{title}</SplitWords>
        <p data-reveal="up" style={{ "--d": 3 }}>{text}</p>
        <div className="join-actions" data-reveal="up" style={{ "--d": 4 }}>
          <a className="btn btn-cream" href={href} target="_blank" rel="noreferrer">{cta}</a>
          {secondary && (
            <a className="btn btn-line" href={secondary.href} target="_blank" rel="noreferrer">{secondary.label}</a>
          )}
        </div>
      </div>
    </section>
  );
}
