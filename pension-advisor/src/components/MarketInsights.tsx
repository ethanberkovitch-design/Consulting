import type { InvestmentTrack, MarketBenchmark, PlannerInputs } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import { formatReportPeriod } from '../lib/marketData';
import { formatPercent } from '../lib/format';

interface MarketInsightsProps {
  inputs: PlannerInputs;
  tracks: InvestmentTrack[];
}

function FeeFlag({ label, userValue, marketValue }: { label: string; userValue: number; marketValue: number }) {
  const relativeDiff = marketValue > 0 ? (userValue - marketValue) / marketValue : 0;
  let tone: 'good' | 'warning' | 'critical' | 'neutral' = 'neutral';
  let flagLabel = 'בטווח הממוצע';
  if (relativeDiff > 0.3) {
    tone = 'critical';
    flagLabel = 'גבוה משמעותית מהממוצע';
  } else if (relativeDiff > 0.1) {
    tone = 'warning';
    flagLabel = 'מעט מעל הממוצע';
  } else if (relativeDiff < -0.1) {
    tone = 'good';
    flagLabel = 'נמוך מהממוצע';
  }

  const toneColor =
    tone === 'critical'
      ? 'var(--status-critical)'
      : tone === 'warning'
        ? 'var(--status-warning)'
        : tone === 'good'
          ? 'var(--status-good)'
          : 'var(--text-muted)';
  const toneIcon = tone === 'critical' ? '🔴' : tone === 'warning' ? '🟡' : tone === 'good' ? '🟢' : '⚪';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm">
        <span className="font-bold tabular-nums">{formatPercent(userValue)}</span>
        <span style={{ color: 'var(--text-muted)' }}>מול ממוצע שוק {formatPercent(marketValue)}</span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ color: toneColor, background: `color-mix(in srgb, ${toneColor} 14%, transparent)` }}
        >
          <span aria-hidden="true">{toneIcon}</span>
          {flagLabel}
        </span>
      </span>
    </div>
  );
}

function BenchmarkRow({ track, benchmark }: { track: InvestmentTrack; benchmark: MarketBenchmark }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--surface-2)' }}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <span aria-hidden="true">{track.icon}</span>
        {track.name}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        דמי ניהול ממוצעים: {formatPercent(benchmark.avgDepositFee)} / {formatPercent(benchmark.avgBalanceFee)} · תשואה
        ממוצעת 5 שנים: {formatPercent(benchmark.avgYield5yr)} · {benchmark.fundCount} קרנות
      </span>
    </div>
  );
}

export function MarketInsights({ inputs, tracks }: MarketInsightsProps) {
  const { data, loading, error, retry } = useMarketData();

  return (
    <div
      className="rounded-3xl border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">🛰️</span> נתוני שוק אמיתיים — בזמן אמת
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        תובנות בלבד, לא המלצה לפעולה. מקור: רשות שוק ההון, ביטוח וחיסכון — data.gov.il
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--brand-1)', borderTopColor: 'transparent' }} />
          טוען נתוני שוק עדכניים...
        </div>
      )}

      {!loading && error && (
        <div
          className="flex flex-col gap-2 rounded-xl p-3 text-sm"
          style={{ background: 'color-mix(in srgb, var(--status-warning) 14%, var(--surface-1))' }}
        >
          <span>לא הצלחנו לטעון נתוני שוק בזמן אמת כרגע ({error}). אפשר לנסות שוב.</span>
          <button
            type="button"
            onClick={retry}
            className="w-fit rounded-full px-3 py-1.5 text-xs font-bold text-white"
            style={{ background: 'var(--brand-gradient)' }}
          >
            נסה שוב
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            מבוסס על {data.benchmarks.reduce((sum, b) => sum + b.fundCount, 0)} קרנות פנסיה, נכון לדוח{' '}
            {formatReportPeriod(data.reportPeriod)}. הסיווג למסלולים הוא קיבוץ משוער שלנו לפי חשיפה מנייתית, ולא
            סיווג רשמי.
          </p>

          {(inputs.actualDepositFee !== null || inputs.actualBalanceFee !== null) && tracks[0] && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                המצב הקיים שלך מול השוק ({tracks[0].name})
              </span>
              {(() => {
                const benchmark = data.benchmarks.find((b) => b.trackId === tracks[0].id);
                if (!benchmark) return null;
                return (
                  <div className="flex flex-col gap-2">
                    {inputs.actualDepositFee !== null && (
                      <FeeFlag label="דמי ניהול מהפקדה" userValue={inputs.actualDepositFee} marketValue={benchmark.avgDepositFee} />
                    )}
                    {inputs.actualBalanceFee !== null && (
                      <FeeFlag label="דמי ניהול מצבירה" userValue={inputs.actualBalanceFee} marketValue={benchmark.avgBalanceFee} />
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              ממוצעי שוק לפי מסלול
            </span>
            {tracks.map((track) => {
              const benchmark = data.benchmarks.find((b) => b.trackId === track.id);
              if (!benchmark) return null;
              return <BenchmarkRow key={track.id} track={track} benchmark={benchmark} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
