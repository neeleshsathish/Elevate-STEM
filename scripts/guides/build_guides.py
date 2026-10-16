"""Builds the Elevate STEM guide PDFs from the content in guides_content.py.

Run from the project root:  python3 scripts/guides/build_guides.py
Needs Python Playwright with Chromium. Writes public/guides/<slug>.pdf and public/covers/<slug>.webp.
"""
import asyncio, io, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from guides_content import GUIDES  # noqa: E402

FONTS = ROOT / "node_modules/@fontsource-variable"
import base64
def data_uri(path):
    return "data:font/woff2;base64," + base64.b64encode(path.read_bytes()).decode()
# Fonts are inlined because pages loaded with set_content can't read file:// URLs.
BRICO = data_uri(FONTS / "bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2")
FIG = data_uri(FONTS / "figtree/files/figtree-latin-wght-normal.woff2")
FIG_I = data_uri(FONTS / "figtree/files/figtree-latin-wght-italic.woff2")

SERIF = data_uri(FONTS / "source-serif-4/files/source-serif-4-latin-opsz-normal.woff2")
SERIF_I = data_uri(FONTS / "source-serif-4/files/source-serif-4-latin-opsz-italic.woff2")

# A plain, well-set handout: serif body text, simple sans headings, green step numbers,
# and as few boxes and badges as possible.
CSS = f"""
@font-face {{ font-family: Brico; src: url("{BRICO}") format("woff2"); font-weight: 200 800; }}
@font-face {{ font-family: Fig; src: url("{FIG}") format("woff2"); font-weight: 300 900; }}
@font-face {{ font-family: Fig; src: url("{FIG_I}") format("woff2"); font-weight: 300 900; font-style: italic; }}
@font-face {{ font-family: Serif; src: url("{SERIF}") format("woff2"); font-weight: 200 900; }}
@font-face {{ font-family: Serif; src: url("{SERIF_I}") format("woff2"); font-weight: 200 900; font-style: italic; }}
:root {{ --ink:#161d2b; --ink2:#3a4254; --ink3:#6d7484; --line:#d5d9e0; --tint:#f3f5f8; --green:#23962a; --bblue:#36549d; --bgreen:#33cc34; }}
* {{ box-sizing: border-box; }}
html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ margin:0; font-family: Serif, Georgia, serif; font-size: 11pt; line-height: 1.58; color: var(--ink); font-optical-sizing: auto; }}
h1, h2, h3 {{ color: var(--ink); margin: 0; line-height: 1.15; }}
h1 {{ font-family: Brico, sans-serif; font-size: 27pt; font-weight: 700; letter-spacing: -0.02em; }}
h2 {{ font-family: Fig, sans-serif; font-size: 13pt; font-weight: 700; margin: 20pt 0 5pt; break-after: avoid; }}
h3 {{ font-family: Fig, sans-serif; font-size: 11pt; font-weight: 700; margin: 12pt 0 3pt; break-after: avoid; }}
p {{ margin: 0 0 7pt; }}
strong {{ font-weight: 650; }}
em {{ font-style: italic; }}
.brand {{ display:flex; align-items:center; gap:7pt; padding-bottom: 8pt; margin-bottom: 26pt; border-bottom: 0.75pt solid var(--line);
  font-family: Fig, sans-serif; font-weight: 600; font-size: 9.5pt; color: var(--ink); }}
.brand span.kind {{ margin-left:auto; font-weight: 500; color: var(--ink3); }}
.from {{ font-style: italic; color: var(--ink3); font-size: 10.5pt; margin: 0 0 4pt; }}
.lede {{ font-size: 12.5pt; line-height: 1.5; color: var(--ink2); margin: 10pt 0 16pt; max-width: 34em; }}
.rule {{ display: none; }}
ol.steps {{ list-style: none; counter-reset: s; padding: 0; margin: 6pt 0 0; }}
ol.steps > li {{ counter-increment: s; position: relative; padding: 0 0 0 26pt; margin: 0 0 11pt; break-inside: avoid; }}
ol.steps > li::before {{ content: counter(s); position: absolute; left: 0; top: -4pt; font-family: Serif; font-size: 19pt; font-weight: 600; color: var(--green); }}
ol.steps h3 {{ margin: 0 0 2pt; }}
ul {{ padding-left: 15pt; margin: 3pt 0 8pt; }}
ul li {{ margin: 0 0 3pt; }}
.ex {{ margin: 2pt 0 0; font-style: italic; color: var(--ink2); }}
.tip {{ margin: 12pt 0; color: var(--ink2); font-style: italic; break-inside: avoid; }}
.tip strong {{ font-style: normal; color: var(--green); }}
.ph {{ color: #2a55b8; }}
.letter {{ border-top: 0.75pt solid var(--line); border-bottom: 0.75pt solid var(--line); padding: 16pt 2pt; margin-top: 10pt; font-size: 11pt; line-height: 1.65; color: var(--ink); }}
.letter p {{ margin: 0 0 10pt; }}
.subject {{ font-family: Fig, sans-serif; font-size: 9.5pt; color: var(--ink3); margin-bottom: 14pt; }}
.note {{ font-size: 10pt; color: var(--ink3); margin-top: 10pt; font-style: italic; }}
table {{ width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; font-size: 10pt; }}
th {{ text-align: left; font-family: Fig, sans-serif; font-weight: 600; font-size: 9pt; color: var(--ink2); padding: 5pt 7pt; border-bottom: 1pt solid var(--ink); }}
td {{ padding: 6pt 7pt; border-bottom: 0.75pt solid var(--line); height: 26pt; vertical-align: top; }}
.fill {{ display: grid; grid-template-columns: auto 1fr; gap: 12pt 10pt; align-items: end; margin: 6pt 0 10pt; }}
.fill span.line {{ border-bottom: 0.75pt solid var(--ink3); height: 15pt; }}
.q {{ break-inside: avoid; margin: 0 0 12pt; }}
.q .lines {{ margin-top: 4pt; }}
.q .lines div {{ border-bottom: 0.75pt solid var(--line); height: 20pt; }}
.sec {{ break-inside: avoid; }}
hr.div {{ border: 0; border-top: 0.75pt solid var(--line); margin: 16pt 0; }}
.signoff {{ margin-top: 18pt; font-style: italic; color: var(--ink2); }}
.closing {{ display: none; }}

/* CV template: plain and classic so it reads like a real CV */
.cv {{ font-size: 10pt; color: #1c2333; line-height: 1.32; }}
.cv .name {{ text-align:center; font-size: 20pt; font-weight: 600; color: var(--ink); }}
.cv .contact {{ text-align:center; color: var(--ink3); margin: 3pt 0 10pt; }}
.cv h2 {{ font-family: Serif; font-size: 10.5pt; font-weight: 700; letter-spacing: 0.08em; margin: 9pt 0 4pt; padding-bottom: 2pt; border-bottom: 1pt solid var(--ink); }}
.cv .row {{ display:flex; justify-content: space-between; gap: 12pt; }}
.cv .entry {{ margin: 0 0 5pt; break-inside: avoid; }}
.cv .role {{ font-style: italic; }}
.cv ul {{ margin: 2pt 0 0; }}
.cv ul li {{ margin: 0 0 1pt; }}

/* Quad chart: one 16:9 slide */
.quad {{ height: 5.02in; display: grid; grid-template-rows: auto 1fr; gap: 8pt; padding: 0; font-family: Fig, sans-serif; }}
.quad header {{ display: grid; grid-template-columns: 1fr auto; align-items: center; background: linear-gradient(90deg, var(--bblue), #338f68 55%, var(--bgreen)); color: #fff; border-radius: 6pt; padding: 10pt 16pt; }}
.quad header h1 {{ color: #f7e7d8; font-size: 18pt; }}
.quad header p {{ margin: 3pt 0 0; color: #f7e7d8; font-size: 10pt; }}
.quad .pid {{ text-align: right; font-size: 9pt; color: #f7e7d8; }}
.quad .pid b {{ display:block; margin-top: 4pt; width: 70pt; border-bottom: 1px solid #f7e7d8; height: 12pt; }}
.quad .grid {{ display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8pt; }}
.quad .cell {{ border: 1pt solid var(--line); border-radius: 6pt; overflow: hidden; display:flex; flex-direction: column; }}
.quad .cell h2 {{ margin: 0; font-size: 11pt; padding: 6pt 10pt; border-bottom: 1pt solid var(--line); background: var(--tint); }}
.quad .cell.b h2 {{ background: var(--tint); }}
.quad .cell p {{ margin: 0; padding: 8pt 10pt; color: var(--ink3); font-size: 9pt; }}
"""

_logo = base64.b64encode((ROOT / "public/brand/logo-256.webp").read_bytes()).decode()
LOGO = f'<img src="data:image/webp;base64,{_logo}" style="width:17pt;height:17pt;border-radius:4pt" alt="">'

def brand(kind):
    return f'<div class="brand">{LOGO}<span>Elevate STEM</span><span class="kind">{kind}</span></div>'

FOOTER = """<div style="width:100%;font-family:Georgia,serif;font-style:italic;font-size:8pt;color:#6d7484;padding:0 0.8in;display:flex;justify-content:space-between">
<span>joinelevatestem.org</span><span><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>"""

async def main():
    out_pdf = ROOT / "public/guides"
    out_cov = ROOT / "public/covers"
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        for g in GUIDES:
            landscape = g.get("landscape", False)
            html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
            if not g.get("bare"):
                html += brand(g["kind"])
            html += g["html"] + "</body></html>"
            await pg.set_content(html, wait_until="load")
            await pg.evaluate("document.fonts.ready")
            if landscape:
                pdf = await pg.pdf(width="10in", height="5.625in", print_background=True,
                                   margin={"top": "0.3in", "bottom": "0.3in", "left": "0.3in", "right": "0.3in"})
            else:
                pdf = await pg.pdf(format="Letter", print_background=True, display_header_footer=True,
                                   header_template="<span></span>", footer_template=FOOTER,
                                   margin={"top": "0.6in", "bottom": "0.7in", "left": "0.8in", "right": "0.8in"})
            (out_pdf / f"{g['slug']}.pdf").write_bytes(pdf)
            print(g["slug"], len(pdf), "bytes")
        await b.close()

    # Covers: render page 1 of each PDF
    import subprocess
    for g in GUIDES:
        src = out_pdf / f"{g['slug']}.pdf"
        tmp = f"/tmp/cover_{g['slug']}"
        subprocess.run(["pdftoppm", "-png", "-scale-to", "720", "-f", "1", "-l", "1", "-singlefile", str(src), tmp], check=True)
        Image.open(tmp + ".png").convert("RGB").save(out_cov / f"{g['slug']}.webp", "WEBP", quality=82)
        pages = subprocess.run(["pdfinfo", str(src)], capture_output=True, text=True).stdout
        n = [l for l in pages.splitlines() if l.startswith("Pages:")][0].split()[-1]
        print("cover", g["slug"], "pages", n)

asyncio.run(main())
