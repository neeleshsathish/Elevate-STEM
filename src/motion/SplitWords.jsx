import { Fragment } from "react";

// Renders a heading whose words slide up one after another when it scrolls into view.
export default function SplitWords({ as: Tag = "h2", children, delay = 0, className, ...rest }) {
  const text = String(children);
  const words = text.split(" ");
  return (
    <Tag className={className} data-reveal="words" style={{ "--d": delay }} aria-label={text} {...rest}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="sw" aria-hidden="true">
            <span className="sw-in" style={{ "--wi": i }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
