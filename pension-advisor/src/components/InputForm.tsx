import type { InvestmentTrack, PlannerInputs } from '../types';

interface InputFormProps {
  inputs: PlannerInputs;
  onChange: (inputs: PlannerInputs) => void;
  tracks: InvestmentTrack[];
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-xl border-2 px-3 py-2.5 text-base outline-none transition-colors focus:border-[var(--brand-1)]"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
          }}
        />
        {suffix && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function InputForm({ inputs, onChange, tracks }: InputFormProps) {
  const update = (patch: Partial<PlannerInputs>) => onChange({ ...inputs, ...patch });

  const toggleTrack = (id: string) => {
    const selected = inputs.selectedTrackIds.includes(id)
      ? inputs.selectedTrackIds.filter((t) => t !== id)
      : [...inputs.selectedTrackIds, id];
    update({ selectedTrackIds: selected });
  };

  return (
    <div
      className="flex flex-col gap-5 rounded-3xl border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">✏️</span> הנתונים שלך
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="גיל נוכחי"
          value={inputs.currentAge}
          min={18}
          max={inputs.retirementAge - 1}
          onChange={(v) => update({ currentAge: v })}
        />
        <NumberField
          label="גיל פרישה"
          value={inputs.retirementAge}
          min={inputs.currentAge + 1}
          max={80}
          onChange={(v) => update({ retirementAge: v })}
        />
      </div>

      <NumberField
        label="יתרה פנסיונית נוכחית"
        value={inputs.currentBalance}
        min={0}
        step={1000}
        suffix="₪"
        onChange={(v) => update({ currentBalance: v })}
      />

      <NumberField
        label="שכר חודשי ברוטו"
        value={inputs.monthlySalary}
        min={0}
        step={500}
        suffix="₪"
        onChange={(v) => update({ monthlySalary: v })}
      />

      <NumberField
        label="שיעור הפקדה כולל מהשכר"
        value={Math.round(inputs.contributionRate * 1000) / 10}
        min={0}
        max={30}
        step={0.5}
        suffix="%"
        onChange={(v) => update({ contributionRate: v / 100 })}
      />

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
          <span aria-hidden="true">🧭</span> מסלולי השקעה להשוואה
        </span>
        <div className="flex flex-col gap-2.5">
          {tracks.map((track) => {
            const selected = inputs.selectedTrackIds.includes(track.id);
            return (
              <label
                key={track.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-3.5 py-3 text-sm transition-all"
                style={{
                  borderColor: selected ? track.color : 'var(--border)',
                  background: selected
                    ? `color-mix(in srgb, ${track.color} 10%, var(--surface-1))`
                    : 'var(--surface-2)',
                  boxShadow: selected ? `0 4px 14px color-mix(in srgb, ${track.color} 25%, transparent)` : 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleTrack(track.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: `color-mix(in srgb, ${track.color} 18%, var(--surface-1))` }}
                >
                  {track.icon}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-bold">
                    {track.name}
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--page)', color: 'var(--text-muted)' }}
                    >
                      סיכון {track.riskLevel}
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{track.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
