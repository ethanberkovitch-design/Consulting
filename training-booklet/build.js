// Builds the training booklet as a 17×24 cm saddle-stitched notebook:
//   out/חוברת-הדרכה-פנים-לדפוס.pdf    interior, 3 mm bleed, page count a multiple of 4
//   out/חוברת-הדרכה-כריכה-לדפוס.pdf   covers: front, inside front, inside back, back
//   out/חוברת-הדרכה-לצפייה.pdf        everything in reading order, cropped to trim
//   out/חוברת-הדרכה-עובדים-חדשים.docx  editable Word text at the same page size
// Run: node build.js
//
// Every interior page has a ruled notes column on its left side: the outer
// edge on odd pages, beside the spine on even pages. It sits at the end of each
// Hebrew line, and keeping it on one side lets figures widen into it: Chromium
// shrinks the whole page when content overflows to the right, but not to the
// left (Chromium also clips anything drawn into the page margin, so the notes
// column is inside the page area and sections pad it out). The column, chapter
// tabs and page numbers are drawn on a separate
// "underlay" PDF and the content is stamped on top, so figures (opaque
// background) cover the ruled lines they overlap.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const book = require('./content');
const { figures, C } = require('./figures');

const OUT = path.join(__dirname, 'out');
const TMP = path.join(OUT, '.tmp');
fs.mkdirSync(TMP, { recursive: true });
const FILES = {
  interior: path.join(OUT, 'חוברת-הדרכה-פנים-לדפוס.pdf'),
  cover: path.join(OUT, 'חוברת-הדרכה-כריכה-לדפוס.pdf'),
  view: path.join(OUT, 'חוברת-הדרכה-לצפייה.pdf'),
  docx: path.join(OUT, 'חוברת-הדרכה-עובדים-חדשים.docx'),
};

// Geometry in mm. Interior page 1 is a left-hand page (Hebrew books bind on
// the right), so odd pages have their outer edge on the left.
const G = { bleed: 3, w: 170, h: 240, inner: 15, outer: 8, notes: 30, gap: 5, top: 14, bottom: 17 };
G.pw = G.w + 2 * G.bleed; G.ph = G.h + 2 * G.bleed;
G.breakout = G.notes + G.gap;   // how far a figure reaches into the notes column
// Odd pages have the outer margin on the left, even pages the spine margin.
G.left = (odd) => G.bleed + (odd ? G.outer : G.inner);
G.right = (odd) => G.bleed + (odd ? G.inner : G.outer);
const MM = 72 / 25.4;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chapters = book.chapters.map((ch, i) => ({ ...ch, n: i + 1 }));
const quizzes = chapters.flatMap((ch) => ch.blocks.filter((b) => b.t === 'quiz').map((b) => ({ ch, items: b.items })));
const fig = (id) => { if (!figures[id]) throw new Error(`missing figure ${id}`); return figures[id](); };
const edition = `מהדורה 1 · ${new Date().toISOString().slice(0, 7).split('-').reverse().join('/')}`;
const css = fs.readFileSync(path.join(__dirname, 'booklet.css'), 'utf8').replace(/FONTDIR/g, 'file://' + path.join(__dirname, 'fonts'));
const doc = (body, extraCss = '') => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${css}${extraCss}</style></head><body>${body}</body></html>`;

// ───────────────────────── Interior content ─────────────────────────
const icon = (name, size = 28) => `<svg viewBox="-20 -24 40 46" width="${size}" height="${size}">${{
  tip: `<circle cx="0" cy="-6" r="16" fill="${C.yellow}" stroke="${C.ink}" stroke-width="2"/><rect x="-7" y="10" width="14" height="10" rx="2" fill="${C.grey}" stroke="${C.ink}" stroke-width="2"/>`,
  warn: `<path d="M0,-20 L20,16 L-20,16 Z" fill="${C.orange}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/><rect x="-2" y="-8" width="4" height="13" fill="${C.ink}"/><circle cx="0" cy="10" r="2.4" fill="${C.ink}"/>`,
}[name]}</svg>`;

let figSeq = 0;
function blockHtml(b) {
  switch (b.t) {
    case 'lead': return `<p class="lead">${esc(b.text)}</p>`;
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h': return `<h3>${esc(b.text)}</h3>`;
    case 'fig': { const k = ++figSeq; return `<figure><span class="mark" dir="ltr">QQFIG${k}QQ</span>${fig(b.id)}<figcaption>${esc(b.caption)}</figcaption></figure>`; }
    case 'photo': return `<div class="photo"><svg viewBox="0 0 60 44" width="40"><rect x="2" y="8" width="56" height="34" rx="6" fill="none" stroke="${C.grey}" stroke-width="3"/><circle cx="30" cy="25" r="10" fill="none" stroke="${C.grey}" stroke-width="3"/><rect x="20" y="2" width="20" height="8" rx="2" fill="${C.grey}"/></svg><div><b>מקום לתמונה מהמפעל</b><br>${esc(b.caption)}</div></div>`;
    case 'steps': return `<ol class="steps">${b.items.map((s, i) => `<li><span class="num">${i + 1}</span><div><b>${esc(s.title)}</b><br>${esc(s.text)}</div></li>`).join('')}</ol>`;
    case 'tip': return `<div class="call tip">${icon('tip')}<div><b>טיפ</b><br>${esc(b.text)}</div></div>`;
    case 'warn': return `<div class="call warn">${icon('warn')}<div><b>זהירות</b><br>${esc(b.text)}</div></div>`;
    case 'dodont': return `<div class="dd"><div class="do"><div class="ddh">✔ ככה עושים</div><ul>${b.do.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="dont"><div class="ddh">✘ ככה לא עושים</div><ul>${b.dont.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`;
    case 'example': return `<div class="example"><div class="tag">הדגמה</div><b>${esc(b.title.replace(/^הדגמה:\s*/, ''))}</b><p>${esc(b.text)}</p></div>`;
    case 'list': return `<ul class="list">${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    case 'table': return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="first"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'keys': return `<div class="keys"><div class="kh">זכרו!</div><ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    case 'quiz': return `<div class="quiz"><div class="qh">בדקו את עצמכם</div><ol>${b.items.map((q) => `<li>${esc(q.q)}<div class="ans"></div><div class="ans"></div></li>`).join('')}</ol><div class="qf">התשובות בנספח ב'</div></div>`;
    case 'learn': return '';
    default: throw new Error(`unknown block ${b.t}`);
  }
}

function chapterHtml(ch) {
  const learn = ch.blocks.find((b) => b.t === 'learn');
  return `<section class="chapter" style="--c:${ch.color}">
  <span class="mark" dir="ltr">QQCH${ch.n}QQ</span><header class="opener">
    <div class="cnum">${ch.n}</div>
    <div class="ctext"><div class="ctitle">${esc(ch.title)}</div><div class="csub">${esc(ch.subtitle)}</div></div>
  </header>
  ${ch.proc ? `<div class="chips"><span class="chip">הנוהל המלא: ${ch.proc}</span>${ch.forWho ? ` למי: ${esc(ch.forWho)}` : ''}</div>` : ''}
  ${learn ? `<div class="learn"><b>בפרק הזה תלמדו:</b><ul>${learn.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  ${ch.blocks.map(blockHtml).join('\n')}
</section>`;
}

const APPX = [['א', 'מילון מונחים', 'glossary'], ['ב', 'תשובות לשאלות', 'answers'], ['ג', 'טופס אישור הדרכה', 'form']];
function interiorHtml(pages) {
  figSeq = 0;
  const toc = chapters.map((ch) => `<li style="--c:${ch.color}"><span class="tn">${ch.n}</span><span class="tt">${esc(ch.title)}<small>${esc(ch.subtitle)}</small></span><span class="tp">${pages[ch.n] || ''}</span></li>`).join('') +
    APPX.map(([l, tt, k]) => `<li style="--c:${C.grey}"><span class="tn">${l}</span><span class="tt">${tt}</span><span class="tp">${pages[k] || ''}</span></li>`).join('');
  const page = `@page { size: ${G.pw}mm ${G.ph}mm; margin: ${G.bleed + G.top}mm 0 ${G.bleed + G.bottom}mm; }
    @page :left { margin-left: ${G.left(true)}mm; margin-right: ${G.right(true)}mm; }
    @page :right { margin-left: ${G.left(false)}mm; margin-right: ${G.right(false)}mm; }
    section { padding-left: ${G.breakout}mm; } figure { margin-left: -${G.breakout}mm; }`;
  return doc(`<section class="toc first"><span class="mark" dir="ltr">QQCHtocQQ</span><h1>מה בחוברת</h1><ol>${toc}</ol>
  <div class="call tip">${icon('tip')}<div><b>איך לקרוא</b><br>פרקים 1–2 לכולם. מפרק 3, התמקדו בפרקים שהחונך סימן לכם. סמנו ✔ ליד כל פרק שסיימתם, וכתבו בעמודת ההערות שבצד כל עמוד.</div></div></section>
${chapters.map(chapterHtml).join('\n')}
<section class="appendix"><span class="mark" dir="ltr">QQCHglossaryQQ</span><h1>נספח א': מילון מונחים</h1>
  <table class="gl"><tbody>${book.glossary.slice().sort((a, b) => a[0].localeCompare(b[0], 'he')).map(([a, b]) => `<tr><td class="first">${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></section>
<section class="appendix"><span class="mark" dir="ltr">QQCHanswersQQ</span><h1>נספח ב': תשובות לשאלות</h1>
  ${quizzes.map(({ ch, items }) => `<div class="ansblock" style="--c:${ch.color}"><h3>פרק ${ch.n}: ${esc(ch.title)}</h3><ol>${items.map((q) => `<li><b>${esc(q.q)}</b><br>${esc(q.a)}</li>`).join('')}</ol></div>`).join('')}</section>
<section class="appendix"><span class="mark" dir="ltr">QQCHformQQ</span><h1>נספח ג': טופס אישור הדרכה</h1>
  <p>אני מאשר/ת שקראתי את פרקי החוברת המסומנים, קיבלתי הסבר והדגמה בעמדה, שאלתי את מה שלא היה ברור, ואפעל לפי הנהלים.</p>
  <table class="form"><thead><tr><th>שם העובד/ת</th><th>מספר עובד</th><th>תפקיד</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr></tbody></table>
  <table class="form"><thead><tr><th>פרק</th><th>נושא</th><th>תאריך</th><th>חתימת החונך</th><th>חתימת העובד/ת</th></tr></thead><tbody>${chapters.map((ch) => `<tr><td class="first">${ch.n}</td><td>${esc(ch.title)}</td><td></td><td></td><td></td></tr>`).join('')}</tbody></table>
  <p class="sig">חתימת הממונה הישיר: ________________<br>תאריך: ____________</p></section>`, page);
}

// Markers are invisible ASCII text placed in the flow; pdftotext tells us which
// page each one landed on (chapter starts, appendices and every figure).
function readMarks(pdf) {
  const n = Number(execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]);
  const marks = {};
  for (let p = 1; p <= n; p++) {
    const txt = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), pdf, '-']).toString();
    for (const m of txt.matchAll(/QQ(CH|FIG)([a-z0-9]+?)Q/g)) {
      const key = m[1] === 'FIG' ? `fig${m[2]}` : /^\d+$/.test(m[2]) ? Number(m[2]) : m[2];
      marks[key] ??= p;
    }
  }
  return { n, marks };
}

// ───────────────────────── Underlay: notes, tabs, folios ─────────────────────────
function underlayHtml(n, chapterOf, fullNotesFrom) {
  const pages = [];
  for (let p = 1; p <= n; p++) {
    const odd = p % 2 === 1;
    const side = odd ? 'left' : 'right';     // outer edge
    const spine = odd ? 'right' : 'left';
    const ch = chapterOf(p);
    const full = p >= fullNotesFrom;
    const notesLeft = G.bleed + (odd ? G.outer : G.inner);
    const notesTop = G.bleed + G.top;
    const notesH = G.h - G.top - G.bottom;
    const width = full ? G.w - G.outer - G.inner : G.notes;
    const lines = Math.floor((notesH - 9) / 7.5);
    pages.push(`<div class="pg">
      <div class="notes${full ? ' full' : ''}" style="left:${notesLeft}mm;top:${notesTop}mm;width:${width}mm;height:${notesH}mm">
        <div class="nh">✎ הערות</div>${'<div class="nl"></div>'.repeat(lines)}</div>
      ${ch ? `<div class="tab" style="${side}:0;top:${G.bleed + 20 + (ch.n - 1) * 15.5}mm;background:${ch.color};border-${spine === 'right' ? 'top-right' : 'top-left'}-radius:2.5mm;border-${spine === 'right' ? 'bottom-right' : 'bottom-left'}-radius:2.5mm">
        <span style="${side}:${G.bleed}mm">${ch.n}</span></div>` : ''}
      <div class="folio" style="${side}:${G.bleed + G.outer}mm;bottom:${G.bleed + 7}mm">${p}</div>
      <div class="run" style="${spine}:${G.bleed + G.inner}mm;bottom:${G.bleed + 7}mm">${esc(book.subtitle)}${ch ? ` · ${esc(ch.title)}` : ''}</div>
    </div>`);
  }
  return doc(pages.join(''), `@page { size: ${G.pw}mm ${G.ph}mm; margin: 0; }
    body { margin: 0; } .pg { width: ${G.pw}mm; height: ${G.ph}mm; position: relative; break-after: page; overflow: hidden; }
    .notes { position: absolute; display: flex; flex-direction: column; }
    .notes .nh { font-size: 7.5pt; font-weight: 700; color: #8A96A3; height: 9mm; line-height: 9mm; border-bottom: .35mm solid #AAB5C0; }
    .notes.full .nh { font-size: 11pt; color: var(--navy); }
    .notes .nl { height: 7.5mm; flex: none; border-bottom: .25mm solid #D3DAE1; }
    .tab { position: absolute; width: ${G.bleed + 6}mm; height: 13mm; }
    .tab span { position: absolute; width: 6mm; top: 0; height: 13mm; line-height: 13mm; text-align: center; color: #fff; font-weight: 800; font-size: 9pt; }
    .folio { position: absolute; width: ${G.notes}mm; text-align: center; font-weight: 800; font-size: 9pt; color: var(--navy); }
    .run { position: absolute; font-size: 7pt; color: #8A96A3; }`);
}

// ───────────────────────── Covers ─────────────────────────
const stripe = () => `<div class="stripe">${chapters.map((ch) => `<span style="background:${ch.color}"></span>`).join('')}</div>`;
const coverHtml = () => doc(`
<section class="cv front">
  <div class="band"></div>
  <div class="co">${esc(book.company)}</div>
  <div class="t1">${esc(book.title)}</div>
  <div class="t2">${esc(book.subtitle)}</div>
  <div class="art">${fig('journey')}</div>
  <div class="units">${esc(book.units)}</div>
  <div class="owner"><div>שם העובד/ת</div><div class="ln"></div><div>מפעל</div><div class="ln"></div></div>
  ${stripe()}
</section>
<section class="cv inside">
  <h2>החוברת הזו שייכת ל:</h2>
  <div class="fields">${['שם', 'תפקיד', 'מפעל', 'תאריך תחילת עבודה', 'החונך שלי'].map((f) => `<div class="f"><span>${f}</span><div class="ln"></div></div>`).join('')}</div>
  <h3>הסמלים בחוברת</h3>
  <div class="legend">${fig('legend')}</div>
  <div class="howto"><b>איך עובדים עם החוברת?</b> קוראים פרק, מסמנים מה לא ברור, ושואלים את החונך. בצד כל עמוד יש עמודת <b>הערות</b>: כתבו בה מה שמסבירים לכם בעמדה. החוברת היא שלכם, ומותר לכתוב בה.</div>
  <div class="ed">${edition} · טיוטה לאישור מנהל האיכות</div>
</section>
<section class="cv inside">
  <h2>טלפונים חשובים</h2>
  <table class="form"><thead><tr><th>תפקיד</th><th>שם</th><th>טלפון</th></tr></thead><tbody>${book.phones.map((r) => `<tr><td class="first">${r}</td><td></td><td></td></tr>`).join('')}</tbody></table>
  <div class="sos"><div><b>101</b><span>מד"א</span></div><div><b>102</b><span>כבאות</span></div><div><b>100</b><span>משטרה</span></div></div>
  <p class="sosn">באירוע חירום: קודם מזעיקים עזרה, ומיד אחר כך מודיעים למנהל המשמרת ולממונה הבטיחות.</p>
</section>
<section class="cv back">
  <div class="band"></div>
  <h2>עשרת כללי הזהב</h2>
  <ol class="rules">${book.goldenRules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
  <div class="bq">אצלנו אף אחד לא נוזף על שאלה או על דיווח.<br>הבעיה היא רק חריגה שאף אחד לא שמע עליה.</div>
  <div class="bco">${esc(book.company)} · ${esc(book.units)}</div>
  ${stripe()}
</section>`, `@page { size: ${G.pw}mm ${G.ph}mm; margin: 0; }
  body { margin: 0; }
  .cv { width: ${G.pw}mm; height: ${G.ph}mm; position: relative; overflow: hidden; break-after: page; padding: ${G.bleed + 16}mm ${G.bleed + 14}mm; text-align: center; }
  .band { position: absolute; inset: 0 0 auto 0; height: ${G.bleed + 9}mm; background: linear-gradient(90deg, var(--navy), var(--orange)); }
  .stripe { position: absolute; inset: auto 0 0 0; height: ${G.bleed + 9}mm; display: flex; }
  .stripe span { flex: 1; }
  .front { background: #fff; padding-top: ${G.bleed + 26}mm; }
  .front .co { font-size: 13pt; font-weight: 700; color: var(--grey); }
  .front .t1 { font-size: 30pt; font-weight: 800; color: var(--navy); line-height: 1.15; margin-top: 5mm; }
  .front .t2 { font-size: 15pt; font-weight: 500; color: var(--orange); margin-top: 2mm; }
  .front .art { margin: 14mm -4mm 0; background: var(--light); border-radius: 14px; padding: 7mm 4mm; }
  .front .art svg { width: 100%; height: auto; display: block; }
  .front .units { margin-top: 8mm; font-size: 10.5pt; font-weight: 500; color: var(--navy); }
  .front .owner { position: absolute; left: ${G.bleed + 22}mm; right: ${G.bleed + 22}mm; bottom: ${G.bleed + 22}mm; display: grid; grid-template-columns: auto 1fr; gap: 5mm 4mm; align-items: end; font-size: 10.5pt; font-weight: 700; color: var(--navy); text-align: right; }
  .ln { border-bottom: .35mm solid #9AA5B1; height: 6mm; }
  .inside { text-align: right; padding-top: ${G.bleed + 18}mm; }
  .inside h2 { font-size: 17pt; font-weight: 800; color: var(--navy); margin: 0 0 6mm; }
  .inside h3 { font-size: 12pt; font-weight: 800; color: var(--navy); margin: 10mm 0 3mm; border: 0; padding: 0; }
  .fields .f { display: grid; grid-template-columns: 34mm 1fr; align-items: end; margin-bottom: 4.5mm; font-weight: 700; }
  .legend svg { width: 100%; height: auto; }
  .howto { background: #FFF6DC; border-right: 5px solid #F2B705; border-radius: 10px; padding: 4mm 5mm; font-size: 9.5pt; margin-top: 6mm; }
  .ed { position: absolute; bottom: ${G.bleed + 12}mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #C0392B; }
  .inside table.form td { height: 10mm; }
  .sos { display: flex; gap: 5mm; margin-top: 10mm; }
  .sos div { flex: 1; background: #FBE5E5; border-radius: 12px; text-align: center; padding: 3mm 0; }
  .sos b { display: block; font-size: 22pt; font-weight: 800; color: #C0392B; line-height: 1.2; }
  .sos span { font-weight: 700; }
  .sosn { font-size: 9.5pt; margin-top: 5mm; }
  .back { background: var(--navy); color: #fff; text-align: right; padding-top: ${G.bleed + 22}mm; }
  .back h2 { font-size: 20pt; font-weight: 800; color: #fff; margin: 0 0 6mm; }
  .rules { list-style: none; counter-reset: r; padding: 0; margin: 0; }
  .rules li { counter-increment: r; display: flex; gap: 3.5mm; align-items: center; background: rgba(255,255,255,.08); border-radius: 10px; padding: 2.2mm 4mm; margin-bottom: 2.4mm; font-size: 10pt; font-weight: 500; }
  .rules li::before { content: counter(r); flex: none; width: 7.5mm; height: 7.5mm; border-radius: 50%; background: var(--orange); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .bq { margin-top: 7mm; font-size: 10.5pt; font-weight: 700; color: #FFD9A8; text-align: center; line-height: 1.5; }
  .bco { position: absolute; left: 0; right: 0; bottom: ${G.bleed + 14}mm; text-align: center; font-size: 8.5pt; color: #AFC0D3; }`);

// ───────────────────────── PDF assembly ─────────────────────────
async function render(browser, html, file) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  await page.close();
}

function py(script, ...args) { execFileSync('python3', ['-I', '-c', script, ...args], { stdio: 'inherit' }); }

// Stamp content over the underlay page by page; pad with full notes pages to a
// multiple of 4; set TrimBox/BleedBox so the print shop sees the trim size.
const ASSEMBLE = `
import sys, pypdf
from pypdf.generic import RectangleObject
under, content, out, bleed = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
u, c = pypdf.PdfReader(under), pypdf.PdfReader(content)
w = pypdf.PdfWriter()
for i, up in enumerate(u.pages):
    if i < len(c.pages):
        up.merge_page(c.pages[i])
    W, H = float(up.mediabox.width), float(up.mediabox.height)
    up.trimbox = RectangleObject([bleed, bleed, W - bleed, H - bleed])
    up.bleedbox = RectangleObject([0, 0, W, H])
    w.add_page(up)
w.write(out)
`;
const VIEW = `
import sys, pypdf
from pypdf.generic import RectangleObject
cover, interior, out, bleed = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
cv, it = pypdf.PdfReader(cover), pypdf.PdfReader(interior)
w = pypdf.PdfWriter()
for p in [cv.pages[0], cv.pages[1], *it.pages, cv.pages[2], cv.pages[3]]:
    W, H = float(p.mediabox.width), float(p.mediabox.height)
    p.cropbox = RectangleObject([bleed, bleed, W - bleed, H - bleed])
    w.add_page(p)
w.write(out)
`;
const TRIMBOX = `
import sys, pypdf
from pypdf.generic import RectangleObject
src, bleed = sys.argv[1], float(sys.argv[2])
r = pypdf.PdfReader(src); w = pypdf.PdfWriter()
for p in r.pages:
    W, H = float(p.mediabox.width), float(p.mediabox.height)
    p.trimbox = RectangleObject([bleed, bleed, W - bleed, H - bleed]); p.bleedbox = RectangleObject([0, 0, W, H])
    w.add_page(p)
w.write(src)
`;

async function buildPdfs(browser) {
  const content = path.join(TMP, 'content.pdf');
  // Pass 1 finds the page of every chapter; pass 2 prints them in the TOC.
  await render(browser, interiorHtml({}), content);
  const p1 = readMarks(content);
  await render(browser, interiorHtml(p1.marks), content);
  const p2 = readMarks(content);
  const moved = Object.keys(p1.marks).filter((k) => p1.marks[k] !== p2.marks[k]);
  if (moved.length) throw new Error(`pagination moved between passes: ${moved.map((k) => `${k} ${p1.marks[k]}→${p2.marks[k]}`).join(", ")}`);

  const starts = chapters.map((ch) => [p2.marks[ch.n], ch]);
  const appendixStart = p2.marks.glossary;
  const chapterOf = (p) => (p >= appendixStart ? null : (starts.filter(([s]) => s <= p).pop() || [])[1] || null);
  const total = Math.ceil(p2.n / 4) * 4;
  const under = path.join(TMP, 'underlay.pdf');
  await render(browser, underlayHtml(total, chapterOf, p2.n + 1), under);
  py(ASSEMBLE, under, content, FILES.interior, String(G.bleed * MM));

  await render(browser, coverHtml(), FILES.cover);
  py(TRIMBOX, FILES.cover, String(G.bleed * MM));
  py(VIEW, FILES.cover, FILES.interior, FILES.view, String(G.bleed * MM));
  return { contentPages: p2.n, total, marks: p2.marks };
}

// ───────────────────────── Word ─────────────────────────
async function rasterFigures(browser) {
  const ids = [...new Set(chapters.flatMap((ch) => ch.blocks.filter((b) => b.t === 'fig').map((b) => b.id)).concat('journey'))];
  const page = await browser.newPage({ deviceScaleFactor: 2.5 });
  const out = {};
  for (const id of ids) {
    await page.setContent(doc(`<div id="f" style="display:inline-block;background:#fff">${fig(id)}</div>`));
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$('#f svg');
    const box = await el.boundingBox();
    const file = path.join(TMP, `${id}.png`);
    await el.screenshot({ path: file });
    out[id] = { file, w: box.width, h: box.height };
  }
  await page.close();
  return out;
}

function buildDocx(pngs) {
  const d = require('docx');
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, Footer, PageNumber, ImageRun, HeadingLevel } = d;
  const FONT = 'Arial', TW = 56.693, M = 850, W = Math.round(G.w * TW) - 2 * M, hex = (c) => c.replace('#', '');
  const run = (text, o = {}) => new TextRun({ text, font: FONT, rightToLeft: true, size: o.size || 20, bold: o.bold, color: o.color });
  const para = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: o.align, heading: o.heading, keepNext: o.keepNext, pageBreakBefore: o.pageBreak,
    spacing: { before: o.before ?? 50, after: o.after ?? 100, line: 300 }, numbering: o.num ? { reference: o.num, level: 0 } : undefined,
    children: Array.isArray(text) ? text : [run(text, o)] });
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const boxT = (children, fill, accent) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], visuallyRightToLeft: true,
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill },
      borders: { top: none, bottom: none, left: none, right: { style: BorderStyle.SINGLE, size: 24, color: accent } }, margins: { top: 100, bottom: 100, left: 160, right: 160 }, children })] })] });
  const sp = () => para('', { before: 0, after: 50 });
  const maxPx = Math.floor(W / 1440 * 96);
  const img = (id) => { const p = pngs[id]; const w = Math.min(maxPx, p.w); return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 30 }, keepNext: true,
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(p.file), transformation: { width: w, height: Math.round(p.h * w / p.w) } })] }); };
  const cellB = { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DC' };
  const table = (head, rows, color) => { const n = head.length; const cw = Array(n).fill(Math.floor(W / n)); cw[0] += W - cw.reduce((a, b) => a + b, 0);
    const cell = (s, i, o = {}) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, borders: { top: cellB, bottom: cellB, left: cellB, right: cellB },
      shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [para(s, { size: 17, bold: o.bold, color: o.color, before: 0, after: 0 })] });
    return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, visuallyRightToLeft: true, rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, { fill: hex(color), bold: true, color: 'FFFFFF' })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, { bold: i === 0, fill: ri % 2 ? 'F3F5F7' : undefined })) }))] }); };

  const blocks = (b, ch) => {
    const col = hex(ch.color);
    switch (b.t) {
      case 'lead': return [para(b.text, { size: 22, color: '1F3A5F' })];
      case 'p': return [para(b.text)];
      case 'h': return [para(b.text, { heading: HeadingLevel.HEADING_2, size: 24, bold: true, color: col, before: 220, keepNext: true })];
      case 'fig': return [img(b.id), para(b.caption, { align: AlignmentType.CENTER, size: 16, color: '6B7785', after: 140 })];
      case 'photo': return [boxT([para('📷  מקום לתמונה מהמפעל', { bold: true, color: '6B7785', before: 500 }), para(b.caption, { color: '6B7785', after: 500 })], 'F6F7F9', '9AA5B1'), sp()];
      case 'steps': return b.items.flatMap((s, i) => [para([run(`${i + 1}.  ${s.title}`, { bold: true, color: col })], { keepNext: true, before: 80, after: 10 }), para(s.text, { after: 70 })]);
      case 'tip': return [boxT([para('💡 טיפ', { bold: true, color: 'A67C00', before: 0 }), para(b.text, { after: 0 })], 'FFF4D6', 'F2B705'), sp()];
      case 'warn': return [boxT([para('⚠ זהירות', { bold: true, color: 'C0392B', before: 0 }), para(b.text, { after: 0 })], 'FDE8DC', 'E8772E'), sp()];
      case 'dodont': return [boxT([para('✔ ככה עושים', { bold: true, color: '2E9E5B', before: 0 }), ...b.do.map((x) => para(x, { num: 'bul', after: 30 }))], 'E6F4EB', '2E9E5B'), sp(),
        boxT([para('✘ ככה לא עושים', { bold: true, color: 'D64545', before: 0 }), ...b.dont.map((x) => para(x, { num: 'bul', after: 30 }))], 'FBE5E5', 'D64545'), sp()];
      case 'example': return [boxT([para(`הדגמה: ${b.title.replace(/^הדגמה:\s*/, '')}`, { bold: true, color: '1F3A5F', before: 0 }), para(b.text, { after: 0 })], 'EAF2FB', '4A90D9'), sp()];
      case 'list': return b.items.map((x) => para(x, { num: 'bul', after: 50 }));
      case 'table': return [table(b.head, b.rows, ch.color), sp()];
      case 'keys': return [boxT([para('זכרו!', { bold: true, size: 22, color: col, before: 0 }), ...b.items.map((x) => para(x, { num: 'bul', bold: true, after: 30 }))], 'F3F5F7', col), sp()];
      case 'quiz': return [para('בדקו את עצמכם', { heading: HeadingLevel.HEADING_2, size: 22, bold: true, color: col, before: 200, keepNext: true }),
        ...b.items.flatMap((q, i) => [para(`${i + 1}. ${q.q}`, { keepNext: true }), para('_________________________________________________', { color: 'B0B8C1', after: 100 })]),
        para('התשובות בנספח ב\'', { size: 16, color: '6B7785' })];
      case 'learn': return [boxT([para('בפרק הזה תלמדו:', { bold: true, color: col, before: 0 }), ...b.items.map((x) => para(x, { num: 'bul', after: 20 }))], 'F6F7F9', col), sp()];
    }
  };
  const chapterDoc = (ch) => [
    para([run(`${ch.n}  `, { bold: true, size: 48, color: hex(ch.color) }), run(ch.title, { bold: true, size: 34, color: hex(ch.color) })], { heading: HeadingLevel.HEADING_1, pageBreak: true, after: 20 }),
    para(ch.subtitle, { size: 21, color: '5B6B7C', after: 40 }),
    ...(ch.proc ? [para(`הנוהל המלא: ${ch.proc}${ch.forWho ? `  ·  למי: ${ch.forWho}` : ''}`, { size: 16, color: '5B6B7C', after: 120 })] : []),
    ...ch.blocks.flatMap((b) => blocks(b, ch)),
  ];
  const H1 = (s) => para(s, { heading: HeadingLevel.HEADING_1, size: 32, bold: true, color: '1F3A5F', pageBreak: true });
  const content = [
    para('', { before: 1200 }), para(book.company, { align: AlignmentType.CENTER, size: 26, bold: true, color: '5B6B7C' }),
    para(book.title, { align: AlignmentType.CENTER, size: 48, bold: true, color: '1F3A5F', before: 160 }), para(book.subtitle, { align: AlignmentType.CENTER, size: 28, color: 'E8772E' }),
    img('journey'), para(book.units, { align: AlignmentType.CENTER, size: 20, color: '5B6B7C', before: 240 }),
    para('שם העובד/ת: ______________________', { align: AlignmentType.CENTER, before: 700 }),
    H1('מה בחוברת'),
    ...chapters.map((ch) => para([run(`${ch.n}.  `, { bold: true, color: hex(ch.color), size: 22 }), run(ch.title, { bold: true, size: 22 }), run(`  ·  ${ch.subtitle}`, { color: '6B7785', size: 18 })], { after: 80 })),
    ...APPX.map(([l, tt]) => para(`${l}. ${tt}`, { size: 20, color: '5B6B7C', after: 60 })),
  ];
  chapters.forEach((ch) => content.push(...chapterDoc(ch)));
  content.push(H1('נספח א\': מילון מונחים'), table(['מונח', 'פירוש'], book.glossary.slice().sort((a, b) => a[0].localeCompare(b[0], 'he')), '#1F3A5F'),
    H1('נספח ב\': תשובות לשאלות'),
    ...quizzes.flatMap(({ ch, items }) => [para(`פרק ${ch.n}: ${ch.title}`, { bold: true, size: 22, color: hex(ch.color), before: 160, keepNext: true }), ...items.flatMap((q, i) => [para(`${i + 1}. ${q.q}`, { bold: true, keepNext: true, after: 10 }), para(q.a, { after: 80 })])]),
    H1('נספח ג\': טופס אישור הדרכה'),
    para('אני מאשר/ת שקראתי את פרקי החוברת המסומנים, קיבלתי הסבר והדגמה בעמדה, שאלתי את מה שלא היה ברור, ואפעל לפי הנהלים.'),
    table(['שם העובד/ת', 'מספר עובד', 'תפקיד'], [['', '', '']], '#1F3A5F'), sp(),
    table(['פרק', 'נושא', 'תאריך', 'חתימת החונך', 'חתימת העובד/ת'], chapters.map((ch) => [String(ch.n), ch.title, '', '', '']), '#1F3A5F'),
    para('חתימת הממונה הישיר: ________________   תאריך: __________', { before: 300 }),
    H1('טלפונים חשובים'), table(['תפקיד', 'שם', 'טלפון'], [...book.phones, 'חירום: מד"א 101 · כבאות 102 · משטרה 100'].map((r) => [r, '', '']), '#1F3A5F'),
    H1('עשרת כללי הזהב'), ...book.goldenRules.map((r, i) => para(`${i + 1}. ${r}`, { bold: true, after: 80 })));

  return Packer.toBuffer(new Document({
    creator: book.company, title: book.title,
    styles: { default: { document: { run: { font: FONT, size: 20, rightToLeft: true } } }, paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: FONT, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: FONT, bold: true }, paragraph: { outlineLevel: 1 } }] },
    numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START, style: { paragraph: { indent: { start: 400, hanging: 260 } } } }] }] },
    sections: [{ properties: { page: { size: { width: Math.round(G.w * TW), height: Math.round(G.h * TW) }, margin: { top: 900, bottom: 900, left: M, right: M } } },
      footers: { default: new Footer({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [run(`${book.subtitle} · עמוד `, { size: 15, color: '7A8794' }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '7A8794' })] })] }) },
      children: content }],
  }));
}

(async () => {
  for (const f of fs.readdirSync(OUT)) if (/\.(pdf|docx|html)$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  const browser = await chromium.launch();
  const r = await buildPdfs(browser);
  console.log(`interior: ${r.contentPages} content pages + ${r.total - r.contentPages} notes pages = ${r.total}`, JSON.stringify(r.marks, (k, v) => (k.startsWith('fig') ? undefined : v)));
  const pngs = await rasterFigures(browser);
  await browser.close();
  fs.writeFileSync(FILES.docx, await buildDocx(pngs));
  console.log('wrote', Object.values(FILES).map((f) => path.basename(f)).join(', '));
})();
