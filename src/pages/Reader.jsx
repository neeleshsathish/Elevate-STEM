import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
// The legacy build includes polyfills, so the reader also works on older iPhones and Chromebooks.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { GUIDES, guideFile, guideDownloadName } from "../data.js";
import GuideSheet from "../components/GuideSheet.jsx";
import NotFound from "./NotFound.jsx";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOMS = [0.6, 0.75, 1, 1.25, 1.5, 2];
const MAX_PAGE_WIDTH = 880; // portrait pages at "fit" never get wider than this
const MAX_WIDE_WIDTH = 1240; // landscape pages (posters, quad charts) get more room

export default function Reader() {
  const { slug } = useParams();
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return <NotFound />;
  return <ReaderView key={slug} guide={guide} />;
}

function ReaderView({ guide }) {
  const [doc, setDoc] = useState(null);
  const [sizes, setSizes] = useState([]); // base width/height of each page at scale 1
  const [status, setStatus] = useState("loading");
  const [zoomIndex, setZoomIndex] = useState(2);
  const [current, setCurrent] = useState(1);
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef(null);

  useEffect(() => {
    document.title = `${guide.title} · Elevate STEM`;
    let cancelled = false;
    const task = pdfjs.getDocument(guideFile(guide));
    task.promise
      .then(async (pdf) => {
        const s = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const vp = (await pdf.getPage(i)).getViewport({ scale: 1 });
          s.push({ w: vp.width, h: vp.height });
        }
        if (cancelled) return;
        setDoc(pdf);
        setSizes(s);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [guide]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoom = ZOOMS[zoomIndex];
  const widthFor = useCallback(
    (size) => {
      const landscape = size.w > size.h;
      const fit = Math.min(stageWidth, landscape ? MAX_WIDE_WIDTH : MAX_PAGE_WIDTH);
      return Math.round(fit * zoom);
    },
    [stageWidth, zoom]
  );

  const pageCount = sizes.length || guide.pages;
  const others = GUIDES.filter((g) => g.slug !== guide.slug && g.tag === guide.tag)
    .concat(GUIDES.filter((g) => g.slug !== guide.slug && g.tag !== guide.tag))
    .slice(0, 3);

  return (
    <div className="reader">
      <div className="reader-bar">
        <Link className="reader-back" to="/resources">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          <span>All guides</span>
        </Link>
        <div className="reader-title">
          <h1>{guide.title}</h1>
          <span className="reader-count" aria-live="polite">
            Page {Math.min(current, pageCount)} of {pageCount}
          </span>
        </div>
        <div className="reader-tools">
          <div className="zoom" role="group" aria-label="Zoom">
            <button
              onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
              disabled={zoomIndex === 0}
              aria-label="Zoom out"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
            </button>
            <button className="zoom-fit" onClick={() => setZoomIndex(2)} aria-label="Fit to width">
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoomIndex((z) => Math.min(ZOOMS.length - 1, z + 1))}
              disabled={zoomIndex === ZOOMS.length - 1}
              aria-label="Zoom in"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
            </button>
          </div>
          <a className="btn btn-highlight btn-sm" href={guideFile(guide)} download={guideDownloadName(guide)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            <span>Download</span>
          </a>
        </div>
      </div>

      <div className="reader-stage-outer">
        <div className="reader-stage" ref={stageRef}>
          {status === "loading" && <p className="reader-msg">Opening {guide.title}…</p>}
          {status === "error" && (
            <div className="reader-msg">
              <p>This guide couldn't be displayed in your browser.</p>
              <a className="btn btn-highlight" href={guideFile(guide)} download={guideDownloadName(guide)}>
                Download the PDF instead
              </a>
            </div>
          )}
          {status === "ready" && stageWidth > 0 && (
            <div className="reader-pages">
              {sizes.map((size, i) => (
                <PdfPage
                  key={i}
                  doc={doc}
                  number={i + 1}
                  total={sizes.length}
                  size={size}
                  width={widthFor(size)}
                  onVisible={setCurrent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="reader-more">
        <div className="wrap">
          <div className="section-head-row">
            <h2>More guides</h2>
            <Link className="text-link" to="/resources">See all {GUIDES.length} guides</Link>
          </div>
          <div className="sheet-grid sheet-grid-3">
            {others.map((g, i) => (
              <GuideSheet key={g.slug} guide={g} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PdfPage({ doc, number, total, size, width, onVisible }) {
  const holderRef = useRef(null);
  const canvasRef = useRef(null);
  const [near, setNear] = useState(number <= 2);
  const height = Math.round((width * size.h) / size.w);

  // Only draw pages that are on or near the screen.
  useEffect(() => {
    const el = holderRef.current;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: "800px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Track which page is in the middle of the screen for the "Page X of Y" counter.
  useEffect(() => {
    const el = holderRef.current;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(number), {
      rootMargin: "-45% 0px -45% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [number, onVisible]);

  useEffect(() => {
    if (!near) return;
    let task;
    let cancelled = false;
    doc.getPage(number).then((page) => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (width / size.w) * dpr;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      task.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, number, near, width, size.w]);

  return (
    <div className="pdf-page" ref={holderRef} style={{ width, height }}>
      <canvas ref={canvasRef} role="img" aria-label={`Page ${number} of ${total}`} />
    </div>
  );
}
