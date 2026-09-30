// Renders an expert's eval cases (questions, attached documents, and what a
// good answer must include) as one page for the product owner to approve.
//   node cases-page.mjs management "מומחה הניהול"  -> management/review.html
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [expert, title] = process.argv.slice(2);
if (!expert || !title) {
  console.error('usage: node cases-page.mjs <expert-dir> "<expert name in Hebrew>"');
  process.exit(2);
}
const cases = JSON.parse(readFileSync(join(expert, 'cases.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const articles = cases.map((c, i) => {
  // A PDF drawing is linked, and its ground truth (what the judge sees) is shown.
  const docs = c.docs.map((d) => d.toLowerCase().endsWith('.pdf')
    ? `<details><summary>📎 <a href="docs/${esc(d)}">${esc(d)}</a></summary><pre>${esc(readFileSync(join(expert, 'docs', `${d}.truth.txt`), 'utf8'))}</pre></details>`
    : `<details><summary>📎 ${esc(d)}</summary><pre>${esc(readFileSync(join(expert, 'docs', d), 'utf8'))}</pre></details>`).join('');
  return `<article><header><span class="num">${String(i + 1).padStart(2, '0')}</span>${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</header>
<p class="q" dir="auto">${esc(c.prompt)}</p>${docs}
<p class="good"><b>מה תשובה טובה צריכה לכלול:</b> <span dir="auto">${esc(c.good)}</span></p></article>`;
}).join('\n');

const heading = `בדיקת ${title} — ${cases.length} שאלות לאישור`;
writeFileSync(join(expert, 'review.html'), `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(heading)}</title>
<style>
:root{--bg:#06101d;--panel:#0b192b;--line:rgba(125,180,240,.18);--ink:#e6eef8;--ink2:#a8bcd4;--cyan:#4fd1e8;--amber:#ffb547}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,'Segoe UI',sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px}
h1{font-size:1.6rem;margin:0 0 8px} .lead{color:var(--ink2);margin:0 0 24px}
article{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:14px}
header{display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
.num{font-family:ui-monospace,monospace;color:var(--amber);font-weight:700}
.tag{font-size:.78rem;border:1px solid var(--line);border-radius:4px;padding:0 8px;color:var(--cyan)}
.q{font-size:1.1rem;font-weight:600;margin:6px 0 10px}
.good{color:var(--ink2);font-size:.92rem;margin:10px 0 0;border-inline-start:2px solid var(--amber);padding-inline-start:10px}
details{margin:6px 0} summary{cursor:pointer;color:var(--cyan)}
pre{white-space:pre-wrap;background:#06101d;border:1px solid var(--line);border-radius:6px;padding:10px;font-size:.85rem;direction:rtl}
</style></head><body><main>
<h1>${esc(heading)}</h1>
<p class="lead">כל שאלה תישלח למומחה פעמיים (effort גבוה ובינוני), ושופט יקבע איזו תשובה טובה יותר לפי הקריטריון שמתחת לשאלה. המסמכים המצורפים סינתטיים ומסומנים ככאלה.</p>
${articles}
</main></body></html>
`);
console.error(`wrote ${join(expert, 'review.html')} (${cases.length} cases)`);
