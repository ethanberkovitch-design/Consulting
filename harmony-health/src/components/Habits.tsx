import { useMemo, useState } from 'react'
import { Moon, Droplet, Footprints, Smile, Zap, Brain, Save } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import type { HabitLog } from '../types.ts'
import { todayIso, isoDaysAgo } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']
const STRESS_EMOJI = ['😌', '🙂', '😐', '😰', '😫']

export function Habits({ data }: Props) {
  const today = todayIso()
  return <HabitsForm key={today} data={data} today={today} />
}

function HabitsForm({ data, today }: { data: ReturnType<typeof useAppData>; today: string }) {
  const existing = data.habits.find(h => h.date === today)
  const targets = data.targets!

  const [form, setForm] = useState<Omit<HabitLog, 'id'>>(() => ({
    date: today,
    sleepHours: existing?.sleepHours ?? 7,
    waterMl: existing?.waterMl ?? 0,
    steps: existing?.steps ?? 0,
    mood: existing?.mood ?? 3,
    stress: existing?.stress ?? 3,
    mindfulnessMinutes: existing?.mindfulnessMinutes ?? 0,
    note: existing?.note ?? '',
  }))

  function save() {
    data.upsertHabit(form)
  }

  function addWater(ml: number) {
    setForm(prev => {
      const updated = { ...prev, waterMl: Math.max(0, prev.waterMl + ml) }
      data.upsertHabit(updated)
      return updated
    })
  }

  // 7-day summary
  const weekSummary = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i))
    return days.map(d => {
      const h = data.habits.find(x => x.date === d)
      return {
        date: d,
        sleepHours: h?.sleepHours ?? 0,
        waterMl: h?.waterMl ?? 0,
        steps: h?.steps ?? 0,
        mindfulnessMinutes: h?.mindfulnessMinutes ?? 0,
      }
    })
  }, [data.habits])

  const avgSleep = weekSummary.reduce((s, d) => s + d.sleepHours, 0) / weekSummary.filter(d => d.sleepHours > 0).length || 0
  const avgSteps = Math.round(weekSummary.reduce((s, d) => s + d.steps, 0) / weekSummary.filter(d => d.steps > 0).length || 0)

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
          עמודים 3–4 · שינה, ראש, הרגלים
        </div>
        <h1 className="text-3xl md:text-4xl">הרגלים ורווחה</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          לא רק מה שאוכלים — גם איך ישנים, איך מרגישים, וכמה זזים
        </p>
      </div>

      {/* Weekly summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <SummaryTile icon={<Moon size={16} />} label="שינה ממוצעת" value={avgSleep ? `${avgSleep.toFixed(1)}h` : '—'} sub="7 ימים אחרונים" />
        <SummaryTile icon={<Footprints size={16} />} label="צעדים בממוצע" value={avgSteps ? avgSteps.toLocaleString() : '—'} sub={`יעד ${targets.stepsGoal.toLocaleString()}`} />
        <SummaryTile icon={<Droplet size={16} />} label="מים היום" value={`${(form.waterMl / 1000).toFixed(1)} ל'`} sub={`יעד ${(targets.waterMl / 1000).toFixed(1)} ל'`} />
        <SummaryTile icon={<Brain size={16} />} label="מיינדפולנס היום" value={`${form.mindfulnessMinutes} דק'`} sub="יעד יומי 10" />
      </div>

      {/* Today's tracker */}
      <div className="card mb-6">
        <div className="section-title">
          <span className="kicker">היום · {new Date().toLocaleDateString('he-IL')}</span>
          <h2>איך אתה מרגיש?</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sleep */}
          <div>
            <label className="label flex items-center gap-2">
              <Moon size={14} /> שעות שינה אתמול
            </label>
            <input
              type="range"
              min={4}
              max={11}
              step={0.5}
              value={form.sleepHours}
              onChange={e => setForm({ ...form, sleepHours: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--navy)' }}
            />
            <div className="text-center serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>
              {form.sleepHours}h
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="label flex items-center gap-2">
              <Smile size={14} /> מצב רוח
            </label>
            <div className="flex gap-2 justify-around">
              {MOOD_EMOJI.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, mood: (i + 1) as 1 | 2 | 3 | 4 | 5 })}
                  className="text-3xl p-2 rounded-xl transition-all"
                  style={{
                    background: form.mood === i + 1 ? 'var(--surface-3)' : 'transparent',
                    transform: form.mood === i + 1 ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <label className="label flex items-center gap-2">
              <Zap size={14} /> רמת לחץ
            </label>
            <div className="flex gap-2 justify-around">
              {STRESS_EMOJI.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, stress: (i + 1) as 1 | 2 | 3 | 4 | 5 })}
                  className="text-3xl p-2 rounded-xl transition-all"
                  style={{
                    background: form.stress === i + 1 ? 'var(--surface-3)' : 'transparent',
                    transform: form.stress === i + 1 ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className="label flex items-center gap-2">
              <Footprints size={14} /> צעדים היום
            </label>
            <input
              type="number"
              className="input"
              placeholder="8000"
              value={form.steps || ''}
              onChange={e => setForm({ ...form, steps: Number(e.target.value) })}
            />
          </div>

          {/* Water */}
          <div className="md:col-span-2">
            <label className="label flex items-center gap-2">
              <Droplet size={14} /> מים
            </label>
            <div className="flex items-center gap-3 mb-2">
              <div className="progress-track flex-1" style={{ height: 12 }}>
                <div className="progress-fill cool" style={{ width: `${Math.min(100, (form.waterMl / targets.waterMl) * 100)}%` }} />
              </div>
              <div className="font-bold" style={{ color: 'var(--navy)' }}>
                {(form.waterMl / 1000).toFixed(1)}/{(targets.waterMl / 1000).toFixed(1)} ל'
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-ghost btn-xs" onClick={() => addWater(250)}>+ כוס</button>
              <button className="btn btn-ghost btn-xs" onClick={() => addWater(500)}>+ בקבוק חצי ל'</button>
              <button className="btn btn-ghost btn-xs" onClick={() => addWater(750)}>+ בקבוק ¾ ל'</button>
              <button className="btn btn-ghost btn-xs" onClick={() => addWater(-250)}>− כוס</button>
            </div>
          </div>

          {/* Mindfulness */}
          <div>
            <label className="label flex items-center gap-2">
              <Brain size={14} /> מיינדפולנס (דקות)
            </label>
            <input
              type="number"
              className="input"
              placeholder="10"
              value={form.mindfulnessMinutes || ''}
              onChange={e => setForm({ ...form, mindfulnessMinutes: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="label">הערה יומית</label>
            <input
              className="input"
              placeholder="מה קרה היום?"
              value={form.note || ''}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <button className="btn btn-primary mt-6" onClick={save}>
          <Save size={16} /> שמור יום
        </button>
      </div>

      {/* Week visualization */}
      <div className="card">
        <div className="section-title">
          <span className="kicker">שבוע אחרון</span>
          <h2>ההרגלים שלך</h2>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekSummary.map((d, i) => (
            <div key={i} className="text-center p-2 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {new Date(d.date).toLocaleDateString('he-IL', { weekday: 'short' })}
              </div>
              <div className="flex flex-col gap-1 items-center">
                <div title="שינה" style={{ fontSize: 12 }}>
                  {d.sleepHours >= 7 ? '💤' : d.sleepHours > 0 ? '😴' : '·'}
                </div>
                <div title="צעדים" style={{ fontSize: 12 }}>
                  {d.steps >= targets.stepsGoal ? '🚶‍♂️' : d.steps > 0 ? '👟' : '·'}
                </div>
                <div title="מיינדפולנס" style={{ fontSize: 12 }}>
                  {d.mindfulnessMinutes >= 5 ? '🧘' : '·'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold-deep)' }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <div className="serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}
