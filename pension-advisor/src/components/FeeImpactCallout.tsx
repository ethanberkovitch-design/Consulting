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
    <div
      className="rounded-3xl border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">💸</span> כמה דמי הניהול "עולים" לך עד הפרישה?
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        ההפרש בין הצבירה הצפויה בתרחיש התשואה הבינוני, לבין צבירה היפותטית ללא דמי ניהול כלל
      </p>
      <div className="flex flex-col gap-3">
        {tracks.map((track) => {
          const impact = computeFeeImpact(inputs, track, 'medium');
          return (
            <div
              key={track.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: 'var(--surface-2)' }}
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
                  style={{ background: `color-mix(in srgb, ${track.color} 18%, var(--surface-1))` }}
                >
                  {track.icon}
                </span>
                {track.name}
              </span>
              <span
                className="rounded-full px-3 py-1 text-sm font-extrabold tabular-nums"
                style={{
                  color: 'var(--status-critical)',
                  background: 'color-mix(in srgb, var(--status-critical) 12%, transparent)',
                }}
              >
                {formatCurrency(impact.lostToFees)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
