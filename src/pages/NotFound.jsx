import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro.jsx";

export default function NotFound() {
  return (
    <PageIntro
      title="This page doesn't exist."
      kicker="Page not found"
      scene="atom"
      actions={
        <>
          <Link className="btn btn-white" to="/">Go to the homepage</Link>
          <Link className="btn btn-glass" to="/resources">Browse the guides</Link>
        </>
      }
    >
      The link may be old or mistyped. Try the homepage or the guides.
    </PageIntro>
  );
}
