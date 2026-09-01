import { useMemo, useState } from 'react'
import {
  Moon,
  Droplet,
  Footprints,
  Smile,
  Zap,
  Brain,
  Save,
  Wine,
  Monitor,
  Sun,
  Users,
  Apple,
  Utensils,
  ToiletIcon as Toilet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import type { HabitLog } from '../types.ts'
import { todayIso, isoDaysAgo } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']
const STRESS_EMOJI = ['😌', '🙂', '😐', '😰', '😫']
const ENERGY_EMOJI = ['🪫', '🔋', '⚡', '⚡⚡', '⚡⚡⚡']
const HUNGER_EMOJI = ['😋', '🙂', '😐', '😕', '🥵']
const CRAVING_EMOJI = ['🚫', '🤏', '🍫', '🍬', '🍭']
const SOCIAL_EMOJI = ['🙈', '🤝', '👥', '🎉', '💞']
const QUALITY_EMOJI = ['😴', '💤', '🌤️', '🌞', '✨']

type Rating = 1 | 2 | 3 | 4 | 5

export function Habits({ data }: Props) {
  const today = todayIso()
  return <HabitsForm key={today} data={data} today={today} />
}

function HabitsForm({ data, today }: { data: ReturnType<typeof useAppData>; today: string }) {
  const existing = data.habits.find(h => h.date === today)
  const targets = data.targets!
  const [expanded, setExpanded] = useState(false)

  const [form, setForm] = useState<Omit<HabitLog, 'id'>>(() => ({
    date: today,
    sleepHours: existing?.sleepHours ?? 7,
    sleepQuality: existing?.sleepQuality,
    waterMl: existing?.waterMl ?? 0,
    steps: existing?.steps ?? 0,
    mood: existing?.mood ?? 3,
    stress: existing?.stress ?? 3,
    energyLevel: existing?.energyLevel,
    hungerLevel: existing?.hungerLevel,
    sweetCravings: existing?.sweetCravings,
    bowelMovements: existing?.bowelMovements,
    alcoholUnits: existing?.alcoholUnits,
    screenTimeHours: existing?.screenTimeHours,
    outdoorMinutes: existing?.outdoorMinutes,
    socialContact: existing?.socialContact,
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
        energy: h?.energyLevel ?? 0,
      }
    })
  }, [data.habits])

  const sleepDays = weekSummary.filter(d => d.sleepHours > 0).length
  const stepDays = weekSummary.filter(d => d.steps > 0).length
  const avgSleep = sleepDays > 0 ? weekSummary.reduce((s, d) => s + d.sleepHours, 0) / sleepDays : 0
  const avgSteps = stepDays > 0 ? Math.round(weekSummary.reduce((s, d) => s + d.steps, 0) / stepDays) : 0

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

          {/* Sleep quality */}
          <RatingRow
            icon={<Moon size={14} />}
            label="איכות שינה"
            value={form.sleepQuality}
            emojis={QUALITY_EMOJI}
            onChange={v => setForm({ ...form, sleepQuality: v })}
          />

          {/* Mood */}
          <RatingRow
            icon={<Smile size={14} />}
            label="מצב רוח"
            value={form.mood}
            emojis={MOOD_EMOJI}
            onChange={v => setForm({ ...form, mood: v })}
          />

          {/* Stress */}
          <RatingRow
            icon={<Zap size={14} />}
            label="רמת לחץ"
            value={form.stress}
            emojis={STRESS_EMOJI}
            onChange={v => setForm({ ...form, stress: v })}
          />

          {/* Energy */}
          <RatingRow
            icon={<Zap size={14} />}
            label="רמת אנרגיה"
            value={form.energyLevel}
            emojis={ENERGY_EMOJI}
            onChange={v => setForm({ ...form, energyLevel: v })}
          />

          {/* Hunger */}
          <RatingRow
            icon={<Utensils size={14} />}
            label="רעב לאורך היום"
            value={form.hungerLevel}
            emojis={HUNGER_EMOJI}
            onChange={v => setForm({ ...form, hungerLevel: v })}
          />

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

        {/* Expandable extras */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="btn btn-ghost btn-sm mt-6 w-full"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'הסתר שאלות נוספות' : 'שאלות נוספות · חשקים, אלכוהול, מסכים, טבע'}
        </button>

        {expanded && (
          <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <RatingRow
              icon={<Apple size={14} />}
              label="חשקים למתוק"
              value={form.sweetCravings}
              emojis={CRAVING_EMOJI}
              onChange={v => setForm({ ...form, sweetCravings: v })}
            />

            <div>
              <label className="label flex items-center gap-2">
                <Toilet size={14} /> יציאות היום
              </label>
              <input
                type="number"
                min={0}
                max={10}
                className="input"
                placeholder="1"
                value={form.bowelMovements ?? ''}
                onChange={e => setForm({ ...form, bowelMovements: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Wine size={14} /> יחידות אלכוהול
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                className="input"
                placeholder="0"
                value={form.alcoholUnits ?? ''}
                onChange={e => setForm({ ...form, alcoholUnits: e.target.value ? Number(e.target.value) : undefined })}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                יחידה = 330 מ"ל בירה / 150 מ"ל יין / 45 מ"ל אלכוהול חזק
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Monitor size={14} /> שעות מסך (מעבר לעבודה)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                className="input"
                placeholder="2"
                value={form.screenTimeHours ?? ''}
                onChange={e => setForm({ ...form, screenTimeHours: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Sun size={14} /> דקות בחוץ / באור טבעי
              </label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="20"
                value={form.outdoorMinutes ?? ''}
                onChange={e => setForm({ ...form, outdoorMinutes: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <RatingRow
              icon={<Users size={14} />}
              label="קשר חברתי משמעותי"
              value={form.socialContact}
              emojis={SOCIAL_EMOJI}
              onChange={v => setForm({ ...form, socialContact: v })}
            />
          </div>
        )}

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

function RatingRow({
  icon,
  label,
  value,
  emojis,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: Rating | undefined
  emojis: string[]
  onChange: (v: Rating) => void
}) {
  return (
    <div>
      <label className="label flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="flex gap-2 justify-around">
        {emojis.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange((i + 1) as Rating)}
            className="text-2xl p-2 rounded-xl transition-all"
            style={{
              background: value === i + 1 ? 'var(--surface-3)' : 'transparent',
              transform: value === i + 1 ? 'scale(1.15)' : 'scale(1)',
              opacity: value === undefined ? 0.7 : value === i + 1 ? 1 : 0.5,
            }}
          >
            {emoji}
          </button>
        ))}
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
