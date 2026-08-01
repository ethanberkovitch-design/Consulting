import type { InvestmentTrack, PlannerInputs, ReturnScenario } from '../types';
import { scenarioLabels } from '../data/investmentTracks';
import { buildTrackProjection } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/format';
import { TrackIcon } from '../lib/trackIcons';

interface ComparisonTableProps {
  inputs: PlannerInputs;
  tracks: InvestmentTrack[];
}

const scenarios: ReturnScenario[] = ['conservative', 'medium', 'optimistic'];

export function ComparisonTable({ inputs, tracks }: ComparisonTableProps) {
  if (tracks.length === 0) return null;

  return (
    <div
      className="overflow-x-auto rounded-3xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">השוואת צבירה סופית לפי מסלול ותרחיש תשואה</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gridline)' }}>
            <th className="px-4 py-3.5 text-right font-bold" style={{ color: 'var(--text-secondary)' }}>
              מסלול
            </th>
            <th className="px-4 py-3.5 text-right font-bold" style={{ color: 'var(--text-secondary)' }}>
              דמי ניהול (הפקדה / צבירה)
            </th>
            {scenarios.map((s) => (
              <th key={s} className="px-4 py-3.5 text-right font-bold" style={{ color: 'var(--text-secondary)' }}>
                תרחיש {scenarioLabels[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} style={{ borderBottom: '1px solid var(--gridline)' }}>
              <td className="px-4 py-3.5 font-bold">
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in srgb, ${track.color} 18%, var(--surface-1))`, color: track.color }}
                  >
                    <TrackIcon trackId={track.id} className="h-4 w-4" />
                  </span>
                  {track.name}
                </span>
              </td>
              <td className="px-4 py-3.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {formatPercent(track.feeFromDeposit)} / {formatPercent(track.feeFromBalance)}
              </td>
              {scenarios.map((s) => (
                <td key={s} className="px-4 py-3.5 font-bold tabular-nums">
                  {formatCurrency(buildTrackProjection(inputs, track, s).finalBalance)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
