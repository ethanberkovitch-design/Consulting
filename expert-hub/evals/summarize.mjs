// Per-variant summary of an eval flow: quality metrics with 95% intervals,
// latency, output tokens and cost derived from each row's model x usage.
//   node summarize.mjs concrete/runs  > summary.md
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const flow = process.argv[2];
if (!flow) {
  console.error('usage: node summarize.mjs <flow-dir>');
  process.exit(2);
}
const state = JSON.parse(readFileSync(join(flow, '_state.json'), 'utf8'));
const prices = state.prices ?? {};

function cost(model, usage) {
  if (!model || !usage) return 0;
  const p = prices[model];
  if (!p) throw new Error(`no price for model ${model} - add it to _state.json prices`);
  const M = 1e6;
  return ((usage.input_tokens ?? 0) * p.in
    + (usage.cache_creation_input_tokens ?? 0) * p.in * 1.25
    + (usage.cache_read_input_tokens ?? 0) * p.in * 0.1
    + (usage.output_tokens ?? 0) * p.out) / M;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function ci(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
  return 1.96 * sd / Math.sqrt(xs.length);
}

const variants = readdirSync(flow).filter((d) => /^(baseline|v\d+)$/.test(d)).sort((a, b) => (a === 'baseline' ? -1 : b === 'baseline' ? 1 : a.localeCompare(b)));
const lines = ['| variant | cases | errors | ' + state.metrics.map((m) => m.label).join(' | ') + ' | latency median | output tokens median | app $/case | judge $/case |',
  '|' + ' --- |'.repeat(7 + state.metrics.length)];

for (const v of variants) {
  const rp = join(flow, v, 'results.jsonl');
  if (!existsSync(rp)) continue;
  const rows = readFileSync(rp, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const ep = join(flow, v, 'errors.jsonl');
  const errors = existsSync(ep) ? readFileSync(ep, 'utf8').split('\n').filter(Boolean).length : 0;
  const ok = rows.filter((r) => r.stop_reason !== 'max_tokens');
  for (const r of rows) {
    if (!r.model || !r.usage || !(r.usage.output_tokens > 0)) throw new Error(`${v}/${r.prompt_id}: missing model/usage - runner bug, not a result`);
  }
  const metricCells = state.metrics.map((m) => {
    const xs = ok.map((r) => r.grade?.[m.id]).filter((x) => typeof x === 'number');
    return xs.length ? `${mean(xs).toFixed(2)} ± ${ci(xs).toFixed(2)}` : '—';
  });
  const note = state.variant_notes?.[v] ? ` (${state.variant_notes[v]})` : '';
  lines.push(`| ${v}${note} | ${rows.length} | ${errors} | ${metricCells.join(' | ')} | ${median(rows.map((r) => r.latency_s)).toFixed(1)} s | ${median(rows.map((r) => r.usage.output_tokens))} | $${mean(rows.map((r) => cost(r.model, r.usage))).toFixed(3)} | $${mean(rows.map((r) => cost(r.judge_model, r.judge_usage))).toFixed(3)} |`);
}

console.log(`## Eval summary: ${flow}\n`);
console.log(lines.join('\n'));
console.log('\nwin: share of cases where the variant beat the frozen high-effort answer (0.5 = tie; baseline is 0.5 by definition). meets / honest: judge scores against each case criterion. ± is a 95% interval.');
