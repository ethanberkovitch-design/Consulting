import { useMemo, useState } from 'react'
import { Plus, TrendingDown, TrendingUp, Minus, Ruler } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import { todayIso } from '../lib/storage.ts'
import { bmi, bmiCategory } from '../lib/calculations.ts'
import { MiniChart } from './MiniChart.tsx'

interface Props { data: ReturnType<typeof useAppData> }

export function WeightTracker({ data }: Props) {
  const profile = data.profile!
  const [showAdd, setShowAdd] = useState(false)
  const [newWeight, setNewWeight] = useState<string>('')
  const [waist, setWaist] = useState<string>('')
  const [hip, setHip] = useState<string>('')
  const [note, setNote] = useState('')

  const sorted = useMemo(
    () => [...data.weights].sort((a, b) => a.date.localeCompare(b.date)),
    [data.weights],
  )
  const chartData = sorted.map(w => ({
    label: w.date.slice(5),
    value: w.weightKg,
    secondary: w.waistCm,
  }))

  const weeklyAvg = useMemo(() => {
    if (sorted.length < 2) return null
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const recent = sorted.filter(w => new Date(w.date) >= cutoff)
    if (recent.length === 0) return null
    return recent.reduce((s, w) => s + w.weightKg, 0) / recent.length
  }, [sorted])

  const prevWeeklyAvg = useMemo(() => {
    if (sorted.length < 4) return null
    const start = new Date()
    start.setDate(start.getDate() - 14)
    const end = new Date()
    end.setDate(end.getDate() - 7)
    const recent = sorted.filter(w => {
      const d = new Date(w.date)
      return d >= start && d < end
    })
    if (recent.length === 0) return null
    return recent.reduce((s, w) => s + w.weightKg, 0) / recent.length
  }, [sorted])

  const trend = weeklyAvg !== null && prevWeeklyAvg !== null
    ? weeklyAvg - prevWeeklyAvg
    : null

  const currentBmi = bmi(profile)
  const bmiInfo = bmiCategory(currentBmi)

  function addWeight() {
    if (!newWeight) return
    data.addWeight({
      date: todayIso(),
      weightKg: Number(newWeight),
      waistCm: waist ? Number(waist) : undefined,
      hipCm: hip ? Number(hip) : undefined,
      note: note || undefined,
    })
    setNewWeight('')
    setWaist('')
    setHip('')
    setNote('')
    setShowAdd(false)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
            עמוד 5 · מדידה
          </div>
          <h1 className="text-3xl md:text-4xl">משקל ומדדים</h1>
        </div>
        <button className="btn btn-gold" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> רשמו שקילה
        </button>
      </div>

      {/* Top row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card-navy">
          <div className="text-xs uppercase tracking-widest opacity-80">משקל נוכחי</div>
          <div className="big-number" style={{ color: 'var(--text-inverse)' }}>{profile.currentWeightKg}</div>
          <div className="text-sm mt-1 opacity-80">ק"ג · יעד: {profile.goalWeightKg}</div>
        </div>

        <div className="card">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>ממוצע שבועי</div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            {weeklyAvg ? weeklyAvg.toFixed(1) : '—'}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            {trend !== null && (
              <span className="inline-flex items-center gap-1">
                {trend < -0.05 && <TrendingDown size={14} style={{ color: 'var(--status-good)' }} />}
                {trend > 0.05 && <TrendingUp size={14} style={{ color: 'var(--status-critical)' }} />}
                {Math.abs(trend) <= 0.05 && <Minus size={14} style={{ color: 'var(--text-muted)' }} />}
                {trend > 0 ? '+' : ''}{trend.toFixed(1)} ק"ג לעומת שבוע קודם
              </span>
            )}
            {trend === null && 'צריך יותר נתונים לחישוב מגמה'}
          </div>
        </div>

        <div className="card">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>BMI</div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>{currentBmi}</div>
          <div className="text-xs mt-2">
            <span className="pill">{bmiInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <div className="section-title">
          <span className="kicker">גרף מסע</span>
          <h2>ההתקדמות שלך</h2>
        </div>
        {chartData.length > 1 ? (
          <MiniChart
            data={chartData}
            height={300}
            color="#0B1F3A"
            secondaryColor="#7B9E89"
            showGrid
            showAxis
            referenceLine={{ value: profile.goalWeightKg, label: `יעד ${profile.goalWeightKg}`, color: '#C9A961' }}
          />
        ) : (
          <div className="text-center py-10">
            <div className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              רשמו לפחות שתי שקילות כדי לראות מגמה. מומלץ להישקל באותה שעה בכל בוקר.
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> רשמו שקילה ראשונה
            </button>
          </div>
        )}
      </div>

      {/* Recent list */}
      {sorted.length > 0 && (
        <div className="card">
          <div className="section-title">
            <span className="kicker">היסטוריה</span>
            <h2>שקילות אחרונות</h2>
          </div>
          <div className="space-y-2">
            {[...sorted].reverse().slice(0, 12).map(w => (
              <div key={w.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                <div>
                  <div className="font-semibold">{w.weightKg} ק"ג</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(w.date).toLocaleDateString('he-IL')} {w.waistCm && `· מותן ${w.waistCm} ס"מ`} {w.hipCm && `· ירך ${w.hipCm} ס"מ`}
                  </div>
                  {w.note && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{w.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl mb-4">שקילה של היום</h3>
            <div className="space-y-4">
              <div>
                <label className="label">משקל (ק"ג)</label>
                <input className="input" type="number" step="0.1" placeholder="72.5" autoFocus value={newWeight} onChange={e => setNewWeight(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label flex items-center gap-1"><Ruler size={12} /> מותן (ס"מ)</label>
                  <input className="input" type="number" step="0.5" placeholder="80" value={waist} onChange={e => setWaist(e.target.value)} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Ruler size={12} /> ירך (ס"מ)</label>
                  <input className="input" type="number" step="0.5" placeholder="100" value={hip} onChange={e => setHip(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">הערה (אופציונלי)</label>
                <input className="input" placeholder="למשל: אחרי טיול" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-primary flex-1" onClick={addWeight}>שמור</button>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>בטל</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
