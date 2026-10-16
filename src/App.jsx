import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Resources from "./pages/Resources.jsx";
import Team from "./pages/Team.jsx";
import Partners from "./pages/Partners.jsx";
import Sponsors from "./pages/Sponsors.jsx";
import Donate from "./pages/Donate.jsx";
import NotFound from "./pages/NotFound.jsx";
import CursorTrail from "./motion/CursorTrail.jsx";
import { scrollToTop } from "./motion/smoothScroll.js";

// The PDF reader is loaded only when someone opens a guide, so the rest of the site stays fast.
const Reader = lazy(() => import("./pages/Reader.jsx"));

const TITLES = {
  "/": "Elevate STEM",
  "/resources": "Free guides · Elevate STEM",
  "/team": "Team · Elevate STEM",
  "/partners": "Partners · Elevate STEM",
  "/sponsors": "Sponsor us · Elevate STEM",
  "/donate": "Donate · Elevate STEM",
};

function useRouteChange() {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollToTop();
    if (TITLES[pathname]) document.title = TITLES[pathname];
  }, [pathname]);
}

export default function App() {
  useRouteChange();
  const { pathname } = useLocation();
  const isReader = /^\/resources\/[^/]+/.test(pathname);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      {!isReader && <Header />}
      <CursorTrail enabled={!isReader} />
      <main id="main" key={pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route
            path="/resources/:slug"
            element={<Suspense fallback={<div className="reader-loading" />}><Reader /></Suspense>}
          />
          <Route path="/competitions" element={<Navigate to="/" replace />} />
          <Route path="/team" element={<Team />} />
          <Route path="/leadership" element={<Team />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isReader && <Footer />}
    </>
  );
}
