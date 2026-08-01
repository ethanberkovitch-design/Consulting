import type { InvestmentTrack, PlannerInputs, ReturnScenario } from '../types';
import { scenarioLabels } from '../data/investmentTracks';
import { buildTrackProjection } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/format';

interface ComparisonTableProps {
  inputs: PlannerInputs;
  tracks: InvestmentTrack[];
}

const scenarios: ReturnScenario[] = ['conservative', 'medium', 'optimistic'];

export function ComparisonTable({ inputs, tracks }: ComparisonTableProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">השוואת צבירה סופית לפי מסלול ותרחיש תשואה</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gridline)' }}>
            <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
              מסלול
            </th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
              דמי ניהול (הפקדה / צבירה)
            </th>
            {scenarios.map((s) => (
              <th key={s} className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                תרחיש {scenarioLabels[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} style={{ borderBottom: '1px solid var(--gridline)' }}>
              <td className="px-4 py-3 font-medium">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: track.color }}
                  />
                  {track.name}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {formatPercent(track.feeFromDeposit)} / {formatPercent(track.feeFromBalance)}
              </td>
              {scenarios.map((s) => (
                <td key={s} className="px-4 py-3 font-medium tabular-nums">
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
