import type { InvestmentTrack, PlannerInputs } from '../types';
import { computeFeeImpact } from '../lib/calculations';
import { formatCurrency } from '../lib/format';

interface FeeImpactCalloutProps {
  inputs: PlannerInputs;
  tracks: InvestmentTrack[];
}

export function FeeImpactCallout({ inputs, tracks }: FeeImpactCalloutProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <h2 className="mb-1 text-lg font-semibold">כמה דמי הניהול "עולים" לך עד הפרישה?</h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        ההפרש בין הצבירה הצפויה בתרחיש התשואה הבינוני, לבין צבירה היפותטית ללא דמי ניהול כלל
      </p>
      <div className="flex flex-col gap-3">
        {tracks.map((track) => {
          const impact = computeFeeImpact(inputs, track, 'medium');
          return (
            <div
              key={track.id}
              className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
              style={{ background: 'var(--page)' }}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: track.color }}
                />
                {track.name}
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold tabular-nums" style={{ color: 'var(--status-critical)' }}>
                <span aria-hidden="true">💸</span>
                {formatCurrency(impact.lostToFees)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
