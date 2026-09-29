// Human review page for an eval flow: per case, the question, each variant's
// answer, and the judge's grades and reasoning side by side. Also prints a
// compact per-case grade log to stdout (answers excluded) for CI logs.
//   node review-page.mjs concrete/runs   -> concrete/runs/review.html
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const flow = process.argv[2];
if (!flow) {
  console.error('usage: node review-page.mjs <flow-dir>');
  process.exit(2);
}
const state = JSON.parse(readFileSync(join(flow, '_state.json'), 'utf8'));
const variants = readdirSync(flow).filter((d) => /^(baseline|v\d+)$/.test(d))
  .sort((a, b) => (a === 'baseline' ? -1 : b === 'baseline' ? 1 : a.localeCompare(b)));

const byCase = new Map();
for (const v of variants) {
  const rp = join(flow, v, 'results.jsonl');
  if (!existsSync(rp)) continue;
  for (const line of readFileSync(rp, 'utf8').split('\n').filter(Boolean)) {
    const row = JSON.parse(line);
    const tp = join(flow, v, 'traces', `${row.prompt_id}_rep${row.rep}.json`);
    const trace = existsSync(tp) ? JSON.parse(readFileSync(tp, 'utf8')) : [];
    const answer = trace.filter((t) => t.role === 'assistant').map((t) => t.content).join('\n\n');
    if (!byCase.has(row.prompt_id)) byCase.set(row.prompt_id, { prompt: row.prompt, tags: row.tags ?? [], runs: {} });
    byCase.get(row.prompt_id).runs[v] = { row, answer };
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const label = (v) => `${v}${state.variant_notes?.[v] ? ` — ${state.variant_notes[v]}` : ''}`;

// CI log: one JSON line per answer - grades, judge reasoning and the answer itself.
for (const [id, c] of byCase) {
  for (const v of variants) {
    const run = c.runs[v];
    if (!run) continue;
    const r = run.row;
    console.log(JSON.stringify({ case: id, variant: v, latency_s: r.latency_s, out_tokens: r.usage?.output_tokens, grade: r.grade, explanation: r.explanation, answer: run.answer }));
  }
}

// Markdown version for the GitHub run page (step summary): readable in any
// browser, no download. One collapsible block per case.
const md = [`## Review: question, answers, and the judge's grades\n`,
  'For each question, open the block and read both answers. Would you have scored anything differently?\n'];
let n = 0;
for (const [id, c] of byCase) {
  n++;
  md.push(`<details><summary><b>${String(n).padStart(2, '0')} · ${esc(c.prompt)}</b></summary>\n`);
  for (const v of variants) {
    const run = c.runs[v];
    if (!run) continue;
    const g = run.row.grade ?? {};
    const ex = run.row.explanation ?? {};
    md.push(`\n### ${esc(label(v))}\n`);
    md.push(`${run.row.latency_s?.toFixed?.(1)} s · ${run.row.usage?.output_tokens} output tokens\n`);
    for (const m of state.metrics) md.push(`- **${esc(m.label)}:** ${g[m.id]}${ex[m.id] ? ` — ${esc(ex[m.id])}` : ''}`);
    md.push(`\n<blockquote>\n\n${run.answer}\n\n</blockquote>\n`);
  }
  md.push('</details>\n');
}
writeFileSync(join(flow, 'review.md'), md.join('\n'));

const sections = [...byCase].map(([id, c], i) => {
  const cols = variants.filter((v) => c.runs[v]).map((v) => {
    const { row, answer } = c.runs[v];
    const g = row.grade ?? {};
    const ex = row.explanation ?? {};
    const grades = state.metrics.map((m) => `<li><b>${esc(m.label)}:</b> ${esc(g[m.id])}${ex[m.id] ? ` <span class="why">${esc(ex[m.id])}</span>` : ''}</li>`).join('');
    return `<div class="col"><h3>${esc(label(v))}</h3>
      <p class="meta">${esc(row.latency_s?.toFixed?.(1))} s · ${esc(row.usage?.output_tokens)} output tokens</p>
      <ul class="grades">${grades}</ul>
      <pre dir="auto">${esc(answer)}</pre></div>`;
  }).join('');
  return `<section><header><span class="num">${String(i + 1).padStart(2, '0')}</span> <code>${esc(id)}</code> ${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</header>
    <p class="q" dir="auto">${esc(c.prompt)}</p><div class="cols">${cols}</div></section>`;
}).join('\n');

const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Eval review — ${esc(flow)}</title>
<style>
:root{--bg:#06101d;--panel:#0b192b;--line:rgba(125,180,240,.18);--ink:#e6eef8;--ink2:#a8bcd4;--cyan:#4fd1e8;--amber:#ffb547}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,'Segoe UI',sans-serif}
main{max-width:1280px;margin:0 auto;padding:28px 16px}
h1{font-size:1.5rem;margin:0 0 6px} .lead{color:var(--ink2);margin:0 0 20px}
section{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:16px}
header{display:flex;gap:8px;align-items:center;flex-wrap:wrap} .num{color:var(--amber);font-weight:700;font-family:ui-monospace,monospace}
code{color:var(--ink2)} .tag{font-size:.78rem;border:1px solid var(--line);border-radius:4px;padding:0 8px;color:var(--cyan)}
.q{font-size:1.05rem;font-weight:600;margin:8px 0 12px}
.cols{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.col{border:1px solid var(--line);border-radius:8px;padding:12px;min-width:0}
h3{margin:0 0 4px;font-size:.95rem;color:var(--cyan)} .meta{margin:0 0 6px;color:var(--ink2);font-size:.85rem}
.grades{margin:0 0 8px;padding-inline-start:18px;font-size:.88rem} .why{color:var(--ink2)}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#06101d;border:1px solid var(--line);border-radius:6px;padding:10px;font:inherit;font-size:.9rem;max-height:520px;overflow:auto}
</style></head><body><main>
<h1>סקירת ציונים — ${esc(flow)}</h1>
<p class="lead">לכל שאלה: התשובות של כל גרסה, הציונים של השופט וההנמקה שלו. השאלה לבדיקה: האם היית נותן את אותם ציונים?</p>
${sections}
</main></body></html>`;
writeFileSync(join(flow, 'review.html'), html);
console.error(`wrote ${join(flow, 'review.html')} (${byCase.size} cases, ${variants.length} variants)`);
