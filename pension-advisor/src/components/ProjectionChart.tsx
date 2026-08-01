import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrackProjection } from '../types';
import { formatCurrency } from '../lib/format';

interface ProjectionChartProps {
  projections: TrackProjection[];
}

function mergeByAge(projections: TrackProjection[]) {
  const ageMap = new Map<number, Record<string, number>>();

  for (const projection of projections) {
    for (const point of projection.points) {
      const row = ageMap.get(point.age) ?? { age: point.age };
      row[projection.track.id] = Math.round(point.balance);
      ageMap.set(point.age, row);
    }
  }

  return Array.from(ageMap.values()).sort((a, b) => a.age - b.age);
}

function CustomTooltip({ active, payload, label, projections }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-md border px-3 py-2 text-sm shadow-lg"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    >
      <div className="mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
        גיל {label}
      </div>
      {payload.map((entry: any) => {
        const track = projections.find((p: TrackProjection) => p.track.id === entry.dataKey)?.track;
        if (!track) return null;
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: track.color }}
              />
              {track.name}
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectionChart({ projections }: ProjectionChartProps) {
  if (projections.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-muted)' }}
      >
        בחר/י לפחות מסלול השקעה אחד כדי לראות תחזית צבירה.
      </div>
    );
  }

  const data = mergeByAge(projections);

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <h2 className="mb-1 text-lg font-semibold">תחזית צבירה עד גיל הפרישה</h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        תרחיש תשואה בינוני, לפי המסלולים שנבחרו
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="var(--gridline)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="age"
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}K`}
            width={48}
          />
          <Tooltip content={<CustomTooltip projections={projections} />} />
          <Legend
            wrapperStyle={{ fontSize: 13, color: 'var(--text-secondary)' }}
            formatter={(value: string) => projections.find((p) => p.track.id === value)?.track.name ?? value}
          />
          {projections.map((projection) => (
            <Line
              key={projection.track.id}
              dataKey={projection.track.id}
              name={projection.track.id}
              stroke={projection.track.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
