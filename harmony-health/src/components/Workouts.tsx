import { useMemo, useState } from 'react'
import { Dumbbell, Play, Plus, CheckCircle2, Flame } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import { planWeekWorkouts, type WorkoutBlock } from '../lib/workoutPlanner.ts'
import { caloriesFromExercise } from '../lib/calculations.ts'
import { todayIso } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

const DAY_NAMES = ['יום 1', 'יום 2', 'יום 3', 'יום 4', 'יום 5', 'יום 6', 'יום 7']

export function Workouts({ data }: Props) {
  const profile = data.profile!
  const [selectedDay, setSelectedDay] = useState(0)
  const [logging, setLogging] = useState(false)

  const week = useMemo(() => planWeekWorkouts(profile), [profile])
  const day = week[selectedDay]

  const todaysWorkouts = useMemo(
    () => data.workouts.filter(w => w.date === todayIso()),
    [data.workouts],
  )
  const weeklyMinutes = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return data.workouts
      .filter(w => new Date(w.date) >= start)
      .reduce((s, w) => s + w.minutes, 0)
  }, [data.workouts])

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
          עמוד 2 · תנועה מותאמת
        </div>
        <h1 className="text-3xl md:text-4xl">אימונים</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          תוכנית שבועית מותאמת לרמת הכושר שלך — משלבת כוח, קרדיו והתאוששות
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card-navy">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-2">השבוע</div>
          <div className="big-number" style={{ color: 'var(--text-inverse)' }}>{weeklyMinutes}</div>
          <div className="text-sm mt-1 opacity-80">דקות אימון · יעד 150+</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>אימונים היום</div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>{todaysWorkouts.length}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>אימונים שנרשמו</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>סה"כ קלוריות</div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            {todaysWorkouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>נשרפו היום</div>
        </div>
      </div>

      {/* Weekly plan */}
      <div className="mb-6">
        <div className="section-title">
          <span className="kicker">תוכנית שבועית</span>
          <h2>7 ימים מותאמים אישית</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(i)}
              className="px-4 py-3 rounded-2xl border transition-all whitespace-nowrap min-w-[100px]"
              style={{
                background: selectedDay === i ? 'var(--navy)' : 'var(--surface-1)',
                color: selectedDay === i ? 'var(--text-inverse)' : 'var(--navy)',
                borderColor: selectedDay === i ? 'var(--navy)' : 'var(--border)',
              }}
            >
              <div className="text-xs opacity-80">{name}</div>
              <div className="font-semibold text-sm mt-1">{week[i].totalMinutes} דקות</div>
            </button>
          ))}
        </div>
      </div>

      <WorkoutDay block={day} onLog={() => setLogging(true)} />

      {/* Log today's workouts */}
      <div className="card mt-6">
        <div className="section-title">
          <span className="kicker">יומן אימונים</span>
          <h2>אימונים של היום</h2>
        </div>
        {todaysWorkouts.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              עדיין לא רשמת אימון היום
            </div>
            <button className="btn btn-primary" onClick={() => setLogging(true)}>
              <Plus size={16} /> רשום אימון
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysWorkouts.map(w => (
              <div key={w.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} style={{ color: 'var(--status-good)' }} />
                    {workoutTypeLabel(w.type)} · {w.minutes} דקות
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    עצימות {intensityLabel(w.intensity)}
                    {w.caloriesBurned ? ` · ${w.caloriesBurned} קק"ל` : ''}
                    {w.note ? ` · ${w.note}` : ''}
                  </div>
                </div>
                <Flame size={18} style={{ color: 'var(--gold)' }} />
              </div>
            ))}
            <button className="btn btn-ghost btn-sm w-full" onClick={() => setLogging(true)}>
              <Plus size={14} /> הוסף אימון נוסף
            </button>
          </div>
        )}
      </div>

      {logging && (
        <LogWorkoutModal
          onClose={() => setLogging(false)}
          onSave={(w) => { data.addWorkout(w); setLogging(false) }}
          weightKg={profile.currentWeightKg}
        />
      )}
    </div>
  )
}

function WorkoutDay({ block, onLog }: { block: WorkoutBlock; onLog: () => void }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl">{block.title}</h3>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{block.focus}</div>
        </div>
        {block.totalMinutes > 0 && (
          <span className="pill pill-gold">{block.totalMinutes} דקות</span>
        )}
      </div>

      {block.totalMinutes === 0 && (
        <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--surface-2)' }}>
          <div className="text-4xl mb-2">🛌</div>
          <div className="font-semibold">יום מנוחה</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            הגוף שלך בונה את עצמו בזמן שאתה נח. שינה טובה, הרבה מים, ותנועה קלה בלבד.
          </div>
        </div>
      )}

      {block.cardio && (
        <div className="p-4 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, var(--sage) 0%, var(--sage-deep) 100%)', color: 'var(--text-inverse)' }}>
          <div className="text-xs uppercase tracking-widest opacity-80 mb-1">קרדיו</div>
          <div className="font-semibold text-lg">{block.cardio.name}</div>
          <div className="text-sm opacity-90 mt-1">
            {block.cardio.minutes} דקות · עצימות {intensityLabel(block.cardio.intensity)}
          </div>
        </div>
      )}

      {block.exercises.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold-deep)' }}>
            תרגילי הבלוק
          </div>
          {block.exercises.map((ex, i) => (
            <div key={ex.id + i} className="p-4 rounded-xl border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                    <Dumbbell size={16} style={{ color: 'var(--gold-deep)' }} />
                  </div>
                  <div>
                    <div className="font-semibold">{ex.name}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {ex.sets} סטים × {ex.reps} · מנוחה {ex.rest}
                    </div>
                    <div className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {ex.instructions}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {block.totalMinutes > 0 && (
        <button className="btn btn-gold w-full mt-4" onClick={onLog}>
          <Play size={16} /> סמן שביצעת
        </button>
      )}
    </div>
  )
}

function LogWorkoutModal({ onClose, onSave, weightKg }: {
  onClose: () => void
  onSave: (w: { date: string; type: 'strength' | 'cardio' | 'walk' | 'mobility' | 'other'; minutes: number; intensity: 'low' | 'moderate' | 'high'; caloriesBurned?: number; note?: string }) => void
  weightKg: number
}) {
  const [type, setType] = useState<'strength' | 'cardio' | 'walk' | 'mobility' | 'other'>('strength')
  const [minutes, setMinutes] = useState<string>('30')
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate')
  const [note, setNote] = useState('')

  const met = useMemo(() => {
    if (type === 'strength') return intensity === 'high' ? 6 : intensity === 'moderate' ? 5 : 3.5
    if (type === 'cardio') return intensity === 'high' ? 9 : intensity === 'moderate' ? 7 : 5
    if (type === 'walk') return intensity === 'high' ? 5 : intensity === 'moderate' ? 4.3 : 3
    if (type === 'mobility') return 2.5
    return 4
  }, [type, intensity])

  const kcal = caloriesFromExercise(met, Number(minutes) || 0, weightKg)

  function save() {
    onSave({
      date: todayIso(),
      type,
      minutes: Number(minutes),
      intensity,
      caloriesBurned: kcal,
      note: note || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl mb-4">רישום אימון</h3>
        <div className="space-y-4">
          <div>
            <label className="label">סוג</label>
            <div className="grid grid-cols-3 gap-2">
              {(['strength', 'cardio', 'walk', 'mobility', 'other'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`btn ${type === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  {workoutTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">זמן (דקות)</label>
            <input className="input" type="number" value={minutes} onChange={e => setMinutes(e.target.value)} />
          </div>

          <div>
            <label className="label">עצימות</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'moderate', 'high'] as const).map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntensity(i)}
                  className={`btn ${intensity === i ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  {intensityLabel(i)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>הערכת שריפה</div>
            <div className="font-bold text-xl" style={{ color: 'var(--gold-deep)' }}>{kcal} קק"ל</div>
          </div>

          <div>
            <label className="label">הערה (אופציונלי)</label>
            <input className="input" placeholder="הרגשה, משקלים, וכו'" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={save}>שמור</button>
            <button className="btn btn-ghost" onClick={onClose}>בטל</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function workoutTypeLabel(t: string) {
  return t === 'strength' ? 'כוח'
    : t === 'cardio' ? 'קרדיו'
    : t === 'walk' ? 'הליכה'
    : t === 'mobility' ? 'גמישות'
    : 'אחר'
}

function intensityLabel(i: string) {
  return i === 'low' ? 'קלה' : i === 'moderate' ? 'בינונית' : 'גבוהה'
}
