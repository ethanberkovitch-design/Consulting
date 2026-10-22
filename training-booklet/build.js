// Builds the training booklet from content.js + figures.js:
//   out/חוברת-הדרכה-עובדים-חדשים.pdf   designed booklet (Chromium print)
//   out/חוברת-הדרכה-עובדים-חדשים.docx  editable Word version, same text and figures
// Run: node build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const book = require('./content');
const { figures, C } = require('./figures');

const OUT = path.join(__dirname, 'out');
const TMP = path.join(OUT, '.tmp');
const NAME = 'חוברת-הדרכה-עובדים-חדשים';
fs.mkdirSync(TMP, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chapters = book.chapters.map((ch, i) => ({ ...ch, n: i + 1 }));
const quizzes = chapters.flatMap((ch) => ch.blocks.filter((b) => b.t === 'quiz').map((b) => ({ ch, items: b.items })));
const fig = (id) => { if (!figures[id]) throw new Error(`missing figure ${id}`); return figures[id](); };

// ───────────────────────── HTML / PDF ─────────────────────────
const icon = (name, size = 34) => `<svg viewBox="-20 -24 40 46" width="${size}" height="${size}">${{
  tip: `<circle cx="0" cy="-6" r="16" fill="${C.yellow}" stroke="${C.ink}" stroke-width="2"/><rect x="-7" y="10" width="14" height="10" rx="2" fill="${C.grey}" stroke="${C.ink}" stroke-width="2"/>`,
  warn: `<path d="M0,-20 L20,16 L-20,16 Z" fill="${C.orange}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/><rect x="-2" y="-8" width="4" height="13" fill="${C.ink}"/><circle cx="0" cy="10" r="2.4" fill="${C.ink}"/>`,
}[name]}</svg>`;

function blockHtml(b, ch) {
  switch (b.t) {
    case 'lead': return `<p class="lead">${esc(b.text)}</p>`;
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h': return `<h3>${esc(b.text)}</h3>`;
    case 'fig': return `<figure>${fig(b.id)}<figcaption>${esc(b.caption)}</figcaption></figure>`;
    case 'photo': return `<div class="photo"><svg viewBox="0 0 60 44" width="54"><rect x="2" y="8" width="56" height="34" rx="6" fill="none" stroke="${C.grey}" stroke-width="3"/><circle cx="30" cy="25" r="10" fill="none" stroke="${C.grey}" stroke-width="3"/><rect x="20" y="2" width="20" height="8" rx="2" fill="${C.grey}"/></svg><div><b>מקום לתמונה מהמפעל</b><br>${esc(b.caption)}</div></div>`;
    case 'steps': return `<ol class="steps">${b.items.map((s, i) => `<li><span class="num">${i + 1}</span><div><b>${esc(s.title)}</b><br>${esc(s.text)}</div></li>`).join('')}</ol>`;
    case 'tip': return `<div class="call tip">${icon('tip')}<div><b>טיפ</b><br>${esc(b.text)}</div></div>`;
    case 'warn': return `<div class="call warn">${icon('warn')}<div><b>זהירות</b><br>${esc(b.text)}</div></div>`;
    case 'dodont': return `<div class="dd"><div class="do"><div class="ddh">✔ ככה עושים</div><ul>${b.do.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="dont"><div class="ddh">✘ ככה לא עושים</div><ul>${b.dont.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`;
    case 'example': return `<div class="example"><div class="tag">הדגמה</div><b>${esc(b.title.replace(/^הדגמה:\s*/, ''))}</b><p>${esc(b.text)}</p></div>`;
    case 'list': return `<ul class="list">${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    case 'table': return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="first"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'keys': return `<div class="keys"><div class="kh">זכרו!</div><ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    case 'quiz': return `<div class="quiz"><div class="qh">בדקו את עצמכם</div><ol>${b.items.map((q) => `<li>${esc(q.q)}<div class="ans"></div></li>`).join('')}</ol><div class="qf">התשובות בנספח ב'</div></div>`;
    case 'learn': return '';
    default: throw new Error(`unknown block ${b.t}`);
  }
}

function chapterHtml(ch) {
  const learn = ch.blocks.find((b) => b.t === 'learn');
  return `<section class="chapter" style="--c:${ch.color}">
  <header class="opener"><span class="mark">CHMARK-${String(ch.n).padStart(2, '0')}</span>
    <div class="cnum">${ch.n}</div>
    <div class="ctext"><div class="ctitle">${esc(ch.title)}</div><div class="csub">${esc(ch.subtitle)}</div>
    ${ch.proc ? `<div class="chips"><span class="chip">הנוהל המלא: ${ch.proc}</span>${ch.forWho ? `<span class="for">למי: ${esc(ch.forWho)}</span>` : ''}</div>` : ''}</div>
  </header>
  ${learn ? `<div class="learn"><b>בפרק הזה תלמדו:</b><ul>${learn.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  ${ch.blocks.map((b) => blockHtml(b, ch)).join('\n')}
</section>`;
}

const css = fs.readFileSync(path.join(__dirname, 'booklet.css'), 'utf8').replace(/FONTDIR/g, 'file://' + path.join(__dirname, 'fonts'));

function bodyHtml(pages) {
  const toc = chapters.map((ch) => `<li style="--c:${ch.color}"><span class="tn">${ch.n}</span><span class="tt">${esc(ch.title)}<small>${esc(ch.subtitle)}</small></span><span class="tp">${pages[ch.n] || ''}</span></li>`).join('') +
    [['א', 'מילון מונחים', 'glossary'], ['ב', 'תשובות לשאלות', 'answers'], ['ג', 'טלפונים חשובים', 'phones'], ['ד', 'טופס אישור הדרכה', 'form']].map(([l, tt, k]) => `<li style="--c:${C.grey}"><span class="tn">${l}</span><span class="tt">${tt}</span><span class="tp">${pages[k] || ''}</span></li>`).join('');
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="toc"><h1>מה בחוברת</h1><ol>${toc}</ol>
  <div class="call tip">${icon('tip')}<div><b>איך לקרוא</b><br>פרקים 1–2 לכולם. מפרק 3, התמקדו בפרקים שהחונך סימן לכם. השתמשו בטבלה הזו כדי לסמן ✔ ליד כל פרק שסיימתם.</div></div>
</section>
${chapters.map(chapterHtml).join('\n')}
<section class="appendix"><span class="mark">CHMARK-glossary</span><h1>נספח א': מילון מונחים</h1>
  <table class="gl"><tbody>${book.glossary.slice().sort((a, b) => a[0].localeCompare(b[0], 'he')).map(([a, b]) => `<tr><td class="first">${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></section>
<section class="appendix"><span class="mark">CHMARK-answers</span><h1>נספח ב': תשובות לשאלות</h1>
  ${quizzes.map(({ ch, items }) => `<div class="ansblock" style="--c:${ch.color}"><h3>פרק ${ch.n}: ${esc(ch.title)}</h3><ol>${items.map((q) => `<li><b>${esc(q.q)}</b><br>${esc(q.a)}</li>`).join('')}</ol></div>`).join('')}</section>
<section class="appendix"><span class="mark">CHMARK-phones</span><h1>נספח ג': טלפונים חשובים</h1>
  <table class="form"><thead><tr><th>תפקיד</th><th>שם</th><th>טלפון</th></tr></thead><tbody>${['החונך שלי', 'מנהל המשמרת', 'מנהל המפעל', 'הטכנולוג', 'מנהל האיכות', 'ממונה הבטיחות', 'חדר הבקרה', 'חירום (מד"א 101, כיבוי 102)'].map((r) => `<tr><td class="first">${r}</td><td></td><td></td></tr>`).join('')}</tbody></table></section>
<section class="appendix"><span class="mark">CHMARK-form</span><h1>נספח ד': טופס אישור הדרכה</h1>
  <p>אני מאשר/ת שקראתי את פרקי החוברת המסומנים, קיבלתי הסבר והדגמה בעמדה, שאלתי את מה שלא היה ברור, ואפעל לפי הנהלים.</p>
  <table class="form"><thead><tr><th>שם העובד/ת</th><th>מספר עובד</th><th>תפקיד</th><th>מפעל</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr></tbody></table>
  <table class="form"><thead><tr><th>פרק</th><th>נושא</th><th>תאריך</th><th>שם החונך</th><th>חתימת העובד/ת</th></tr></thead><tbody>${chapters.map((ch) => `<tr><td class="first">${ch.n}</td><td>${esc(ch.title)}</td><td></td><td></td><td></td></tr>`).join('')}</tbody></table>
  <p class="sig">חתימת הממונה הישיר: ______________________ &nbsp;&nbsp;&nbsp; תאריך: ____________</p></section>
</body></html>`;
}

const coverHtml = () => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="cover"><div class="cband"></div>
  <div class="cco">${esc(book.company)}</div>
  <div class="ctitle1">${esc(book.title)}</div>
  <div class="csub1">${esc(book.subtitle)}</div>
  <div class="cart">${fig('journey')}</div>
  <div class="cunits">${esc(book.units)}</div>
  <div class="cname">שם העובד/ת: ______________________</div>
  <div class="cdraft">מהדורה 1 · ${new Date().toISOString().slice(0, 10)} · טיוטה לאישור מנהל האיכות</div>
</section></body></html>`;

const footer = `<div style="width:100%;font-family:Heebo;font-size:8.5px;color:#7a8794;padding:0 16mm;display:flex;justify-content:space-between;direction:rtl">
  <span>${esc(book.company)} · ${esc(book.subtitle)}</span><span>עמוד <span class="pageNumber"></span></span></div>`;

async function renderPdf(browser, html, file, withFooter) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: file, format: 'A4', printBackground: true, displayHeaderFooter: withFooter, headerTemplate: '<span></span>', footerTemplate: withFooter ? footer : '<span></span>',
    margin: withFooter ? { top: '14mm', bottom: '16mm', left: '16mm', right: '16mm' } : { top: 0, bottom: 0, left: 0, right: 0 } });
  await page.close();
}

// Chapter openers carry an invisible ASCII marker; find it in the text of each
// rendered page so the table of contents can show real page numbers.
function findPages(pdf) {
  const n = Number(execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]);
  const pages = {};
  for (let p = 1; p <= n; p++) {
    const txt = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), pdf, '-']).toString();
    for (const m of txt.matchAll(/CHMARK-(\w+)/g)) pages[/^\d+$/.test(m[1]) ? Number(m[1]) : m[1]] ??= p; // footer numbering starts after the cover
  }
  return pages;
}

// ───────────────────────── Word ─────────────────────────
async function rasterFigures(browser) {
  const ids = [...new Set(chapters.flatMap((ch) => ch.blocks.filter((b) => b.t === 'fig').map((b) => b.id)).concat('journey'))];
  const page = await browser.newPage({ deviceScaleFactor: 2.5 });
  const out = {};
  for (const id of ids) {
    await page.setContent(`<html><head><style>${css}body{margin:0;background:#fff}</style></head><body><div id="f" style="display:inline-block">${fig(id)}</div></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$('#f svg');
    const box = await el.boundingBox();
    const file = path.join(TMP, `${id}.png`);
    await el.screenshot({ path: file, omitBackground: false });
    out[id] = { file, w: box.width, h: box.height };
  }
  await page.close();
  return out;
}

function buildDocx(pngs) {
  const d = require('docx');
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, Footer, PageNumber, ImageRun, HeadingLevel } = d;
  const FONT = 'Arial', W = 9638, hex = (c) => c.replace('#', '');
  const run = (text, o = {}) => new TextRun({ text, font: FONT, rightToLeft: true, size: o.size || 23, bold: o.bold, color: o.color });
  const para = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: o.align, heading: o.heading, keepNext: o.keepNext, pageBreakBefore: o.pageBreak,
    spacing: { before: o.before ?? 60, after: o.after ?? 120, line: 312 }, numbering: o.num ? { reference: o.num, level: 0 } : undefined,
    children: Array.isArray(text) ? text : [run(text, o)] });
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const boxT = (children, fill, accent, width = W) => new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: [width], visuallyRightToLeft: true,
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: width, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill },
      borders: { top: none, bottom: none, left: none, right: { style: BorderStyle.SINGLE, size: 24, color: accent } }, margins: { top: 120, bottom: 120, left: 200, right: 200 }, children })] })] });
  const sp = () => para('', { before: 0, after: 60 });
  const img = (id) => { const p = pngs[id]; const w = Math.min(600, p.w); return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 }, keepNext: true,
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(p.file), transformation: { width: w, height: Math.round(p.h * w / p.w) } })] }); };
  const cellB = { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DC' };
  const table = (head, rows, color) => { const n = head.length; const cw = Array(n).fill(Math.floor(W / n)); cw[0] += W - cw.reduce((a, b) => a + b, 0);
    const cell = (s, i, o = {}) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, borders: { top: cellB, bottom: cellB, left: cellB, right: cellB },
      shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [para(s, { size: 20, bold: o.bold, color: o.color, before: 0, after: 0 })] });
    return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, visuallyRightToLeft: true, rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, { fill: hex(color), bold: true, color: 'FFFFFF' })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, { bold: i === 0, fill: ri % 2 ? 'F3F5F7' : undefined })) }))] }); };

  const blocks = (b, ch) => {
    const col = hex(ch.color);
    switch (b.t) {
      case 'lead': return [para(b.text, { size: 26, color: '1F3A5F' })];
      case 'p': return [para(b.text)];
      case 'h': return [para(b.text, { heading: HeadingLevel.HEADING_2, size: 28, bold: true, color: col, before: 280, keepNext: true })];
      case 'fig': return [img(b.id), para(b.caption, { align: AlignmentType.CENTER, size: 19, color: '6B7785', after: 160 })];
      case 'photo': return [boxT([para('📷  מקום לתמונה מהמפעל', { bold: true, color: '6B7785', before: 600 }), para(b.caption, { color: '6B7785', after: 600 })], 'F6F7F9', '9AA5B1'), sp()];
      case 'steps': return b.items.flatMap((s, i) => [para([run(`${i + 1}.  ${s.title}`, { bold: true, color: col })], { keepNext: true, before: 100, after: 20 }), para(s.text, { after: 80 })]);
      case 'tip': return [boxT([para('💡 טיפ', { bold: true, color: 'A67C00', before: 0 }), para(b.text, { after: 0 })], 'FFF4D6', 'F2B705'), sp()];
      case 'warn': return [boxT([para('⚠ זהירות', { bold: true, color: 'C0392B', before: 0 }), para(b.text, { after: 0 })], 'FDE8DC', 'E8772E'), sp()];
      case 'dodont': { const half = W / 2; const col2 = (title, items, fill, c) => new TableCell({ width: { size: half, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill },
          borders: { top: { style: BorderStyle.SINGLE, size: 18, color: c }, bottom: none, left: { style: BorderStyle.SINGLE, size: 8, color: 'FFFFFF' }, right: none }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [para(title, { bold: true, color: c, before: 0 }), ...items.map((x) => para(x, { num: 'bul', size: 21, after: 40 }))] });
        return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [half, half], visuallyRightToLeft: true, rows: [new TableRow({ cantSplit: true, children: [col2('✔ ככה עושים', b.do, 'E6F4EB', '2E9E5B'), col2('✘ ככה לא עושים', b.dont, 'FBE5E5', 'D64545')] })] }), sp()]; }
      case 'example': return [boxT([para(`הדגמה: ${b.title.replace(/^הדגמה:\s*/, '')}`, { bold: true, color: '1F3A5F', before: 0 }), para(b.text, { after: 0 })], 'EAF2FB', '4A90D9'), sp()];
      case 'list': return b.items.map((x) => para(x, { num: 'bul', after: 60 }));
      case 'table': return [table(b.head, b.rows, ch.color), sp()];
      case 'keys': return [boxT([para('זכרו!', { bold: true, size: 26, color: col, before: 0 }), ...b.items.map((x) => para(x, { num: 'bul', bold: true, after: 40 }))], 'F3F5F7', col), sp()];
      case 'quiz': return [para('בדקו את עצמכם', { heading: HeadingLevel.HEADING_2, size: 26, bold: true, color: col, before: 240, keepNext: true }),
        ...b.items.flatMap((q, i) => [para(`${i + 1}. ${q.q}`, { keepNext: true }), para('_______________________________________________________________', { color: 'B0B8C1', after: 120 })]),
        para('התשובות בנספח ב\'', { size: 19, color: '6B7785' })];
      case 'learn': return [boxT([para('בפרק הזה תלמדו:', { bold: true, color: col, before: 0 }), ...b.items.map((x) => para(x, { num: 'bul', after: 30 }))], 'F6F7F9', col), sp()];
    }
  };

  const chapterDoc = (ch) => [
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1400, W - 1400], visuallyRightToLeft: true, rows: [new TableRow({ children: [
      new TableCell({ width: { size: 1400, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(ch.color) }, borders: { top: none, bottom: none, left: none, right: none },
        verticalAlign: d.VerticalAlign.CENTER, children: [para(String(ch.n), { align: AlignmentType.CENTER, size: 72, bold: true, color: 'FFFFFF', before: 0, after: 0 })] }),
      new TableCell({ width: { size: W - 1400, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F5F7' }, borders: { top: none, bottom: none, left: none, right: none },
        margins: { top: 160, bottom: 160, left: 240, right: 240 }, children: [para(ch.title, { heading: HeadingLevel.HEADING_1, size: 40, bold: true, color: hex(ch.color), before: 0, after: 40 }), para(ch.subtitle, { size: 24, color: '5B6B7C', after: 40 }),
          ...(ch.proc ? [para(`הנוהל המלא: ${ch.proc}${ch.forWho ? `  ·  למי: ${ch.forWho}` : ''}`, { size: 19, color: '5B6B7C', after: 0 })] : [])] })] })] }),
    sp(), ...ch.blocks.flatMap((b) => blocks(b, ch)),
  ];

  const pb = (text, o = {}) => para(text, { ...o, pageBreak: true });
  const content = [
    para('', { before: 1800 }), para(book.company, { align: AlignmentType.CENTER, size: 30, bold: true, color: '5B6B7C' }),
    para(book.title, { align: AlignmentType.CENTER, size: 60, bold: true, color: '1F3A5F', before: 200 }), para(book.subtitle, { align: AlignmentType.CENTER, size: 34, color: 'E8772E' }),
    img('journey'), para(book.units, { align: AlignmentType.CENTER, size: 24, color: '5B6B7C', before: 300 }),
    para('שם העובד/ת: ______________________', { align: AlignmentType.CENTER, before: 900 }), para('טיוטה לאישור מנהל האיכות', { align: AlignmentType.CENTER, size: 20, color: 'C0392B' }),
    pb('מה בחוברת', { heading: HeadingLevel.HEADING_1, size: 40, bold: true, color: '1F3A5F' }),
    ...chapters.map((ch) => para([run(`${ch.n}.  `, { bold: true, color: hex(ch.color), size: 26 }), run(ch.title, { bold: true, size: 26 }), run(`  ·  ${ch.subtitle}`, { color: '6B7785', size: 21 })], { after: 100 })),
    ...[`א. מילון מונחים`, `ב. תשובות לשאלות`, `ג. טלפונים חשובים`, `ד. טופס אישור הדרכה`].map((s) => para(s, { size: 24, color: '5B6B7C', after: 80 })),
  ];
  chapters.forEach((ch) => { content.push(para('', { pageBreak: true, before: 0, after: 0 }), ...chapterDoc(ch)); });
  const sortedGl = book.glossary.slice().sort((a, b) => a[0].localeCompare(b[0], 'he'));
  content.push(pb('נספח א\': מילון מונחים', { heading: HeadingLevel.HEADING_1, size: 36, bold: true, color: '1F3A5F' }), table(['מונח', 'פירוש'], sortedGl, '#1F3A5F'),
    pb('נספח ב\': תשובות לשאלות', { heading: HeadingLevel.HEADING_1, size: 36, bold: true, color: '1F3A5F' }),
    ...quizzes.flatMap(({ ch, items }) => [para(`פרק ${ch.n}: ${ch.title}`, { bold: true, size: 25, color: hex(ch.color), before: 200, keepNext: true }), ...items.flatMap((q, i) => [para(`${i + 1}. ${q.q}`, { bold: true, keepNext: true, after: 20 }), para(q.a, { after: 100 })])]),
    pb('נספח ג\': טלפונים חשובים', { heading: HeadingLevel.HEADING_1, size: 36, bold: true, color: '1F3A5F' }),
    table(['תפקיד', 'שם', 'טלפון'], ['החונך שלי', 'מנהל המשמרת', 'מנהל המפעל', 'הטכנולוג', 'מנהל האיכות', 'ממונה הבטיחות', 'חדר הבקרה', 'חירום (מד"א 101, כיבוי 102)'].map((r) => [r, '', '']), '#1F3A5F'),
    pb('נספח ד\': טופס אישור הדרכה', { heading: HeadingLevel.HEADING_1, size: 36, bold: true, color: '1F3A5F' }),
    para('אני מאשר/ת שקראתי את פרקי החוברת המסומנים, קיבלתי הסבר והדגמה בעמדה, שאלתי את מה שלא היה ברור, ואפעל לפי הנהלים.'),
    table(['שם העובד/ת', 'מספר עובד', 'תפקיד', 'מפעל'], [['', '', '', '']], '#1F3A5F'), sp(),
    table(['פרק', 'נושא', 'תאריך', 'שם החונך', 'חתימת העובד/ת'], chapters.map((ch) => [String(ch.n), ch.title, '', '', '']), '#1F3A5F'),
    para('חתימת הממונה הישיר: ______________________      תאריך: ____________', { before: 400 }));

  const doc = new Document({
    creator: book.company, title: book.title,
    styles: { default: { document: { run: { font: FONT, size: 23, rightToLeft: true } } }, paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: FONT, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: FONT, bold: true }, paragraph: { outlineLevel: 1 } }] },
    numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START, style: { paragraph: { indent: { start: 460, hanging: 280 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
      footers: { default: new Footer({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [run(`${book.company} · ${book.subtitle} · עמוד `, { size: 17, color: '7A8794' }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: '7A8794' })] })] }) },
      children: content }],
  });
  return Packer.toBuffer(doc);
}

(async () => {
  const browser = await chromium.launch();
  const cover = path.join(TMP, 'cover.pdf'), body = path.join(TMP, 'body.pdf'), pdf = path.join(OUT, `${NAME}.pdf`);
  await renderPdf(browser, coverHtml(), cover, false);
  await renderPdf(browser, bodyHtml({}), body, true);
  const pages = findPages(body);
  await renderPdf(browser, bodyHtml(pages), body, true); // page numbers don't shift: TOC fits one page either way
  execFileSync('pdfunite', [cover, body, pdf]);
  fs.writeFileSync(path.join(OUT, `${NAME}.html`), bodyHtml(pages));
  console.log('wrote', pdf, JSON.stringify(pages));
  const pngs = await rasterFigures(browser);
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${NAME}.docx`), await buildDocx(pngs));
  console.log('wrote', path.join(OUT, `${NAME}.docx`));
})();
