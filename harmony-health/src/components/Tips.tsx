import { useMemo, useState } from 'react'
import { BookOpen, Lightbulb, Sparkles, Filter } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import {
  TIPS,
  tipOfTheDay,
  CATEGORY_LABEL,
  ANGLE_LABEL,
  type TipCategory,
  type TipAngle,
  type Tip,
} from '../data/tips.ts'

interface Props { data: ReturnType<typeof useAppData> }

const CATEGORIES: (TipCategory | 'all')[] = ['all', 'nutrition', 'movement', 'sleep', 'mind', 'measure', 'lifestyle']
const ANGLES: (TipAngle | 'all')[] = ['all', 'fact', 'practice', 'mindset', 'myth', 'reminder', 'quote']

export function Tips({ data }: Props) {
  const [category, setCategory] = useState<TipCategory | 'all'>('all')
  const [angle, setAngle] = useState<TipAngle | 'all'>('all')

  const today = tipOfTheDay()
  const insight = personalInsight(data)

  const filtered = useMemo(() => {
    return TIPS.filter(t =>
      (category === 'all' || t.category === category) &&
      (angle === 'all' || t.angle === angle),
    )
  }, [category, angle])

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
          קול השקט של המאמן
        </div>
        <h1 className="text-3xl md:text-4xl">טיפים והגיגים</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          עובדות מדעיות, הרגלים קטנים, שוברי מיתוסים ותזכורות עדינות. משהו קטן כל יום.
        </p>
      </div>

      {/* Tip of the day — hero */}
      <div className="card-navy mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: 'rgba(201, 169, 97, 0.2)', color: 'var(--gold)' }}>
            <Lightbulb size={24} />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest opacity-80 mb-1">
              הטיפ היומי · {CATEGORY_LABEL[today.category]} · {ANGLE_LABEL[today.angle]}
            </div>
            <h2 className="serif text-2xl mb-2" style={{ color: 'var(--text-inverse)' }}>{today.title}</h2>
            <p className="text-sm opacity-90 leading-relaxed">{today.body}</p>
            {today.deeper && (
              <div className="mt-3 pt-3 border-t text-sm opacity-80 leading-relaxed" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                {today.deeper}
              </div>
            )}
            {today.source && (
              <div className="text-xs mt-2 opacity-60">מקור: {today.source}</div>
            )}
          </div>
        </div>
      </div>

      {/* Personal insight based on the user's data */}
      {insight && (
        <div className="card mb-6" style={{ background: 'var(--surface-2)', border: '1px dashed var(--gold)' }}>
          <div className="flex items-start gap-3">
            <Sparkles size={20} style={{ color: 'var(--gold-deep)' }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold-deep)' }}>
                תובנה אישית
              </div>
              <div className="text-base font-semibold mb-1" style={{ color: 'var(--navy)' }}>{insight.title}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{insight.body}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--gold-deep)' }}>
          <Filter size={14} />
          <span className="text-xs font-bold uppercase tracking-widest">סינון</span>
        </div>
        <div className="mb-3">
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>קטגוריה</div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`pill ${category === c ? 'pill-navy' : ''}`}
              >
                {c === 'all' ? 'הכול' : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>סוג</div>
          <div className="flex gap-2 flex-wrap">
            {ANGLES.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAngle(a)}
                className={`pill ${angle === a ? 'pill-navy' : ''}`}
              >
                {a === 'all' ? 'הכול' : ANGLE_LABEL[a]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tip cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
          אין טיפים שמתאימים לסינון הזה
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(t => <TipCard key={t.id} tip={t} />)}
        </div>
      )}
    </div>
  )
}

function TipCard({ tip }: { tip: Tip }) {
  const [expanded, setExpanded] = useState(false)
  const hasDeeper = !!tip.deeper
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="pill pill-gold">{CATEGORY_LABEL[tip.category]}</span>
        <span className="pill">{ANGLE_LABEL[tip.angle]}</span>
      </div>
      <h3 className="text-xl mb-2 leading-tight">{tip.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tip.body}</p>
      {expanded && hasDeeper && (
        <div className="mt-3 pt-3 border-t text-sm leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {tip.deeper}
        </div>
      )}
      {tip.source && expanded && (
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>מקור: {tip.source}</div>
      )}
      {hasDeeper && (
        <button className="btn btn-ghost btn-xs mt-3" onClick={() => setExpanded(!expanded)}>
          <BookOpen size={12} /> {expanded ? 'סגור' : 'קרא/י יותר'}
        </button>
      )}
    </div>
  )
}

// Look at the user's own recent data and produce a single personalized insight.
function personalInsight(data: ReturnType<typeof useAppData>): { title: string; body: string } | null {
  const habits = data.habits.slice(-7)
  if (habits.length < 3) {
    return {
      title: 'רשמו כמה ימים כדי לקבל תובנות אישיות',
      body: 'ככל שיש יותר נתונים (משקל, שינה, מים, מצב רוח) — כך התובנות פה יהיו יותר ממוקדות אליך.',
    }
  }

  const sleepDays = habits.filter(h => h.sleepHours > 0)
  const avgSleep = sleepDays.length > 0
    ? sleepDays.reduce((s, h) => s + h.sleepHours, 0) / sleepDays.length
    : 0
  if (avgSleep > 0 && avgSleep < 6.5) {
    return {
      title: 'הממוצע השבועי שלך של שינה נמוך',
      body: `${avgSleep.toFixed(1)} שעות בממוצע. שינה מתחת ל-7 שעות מגבירה גרלין (רעב) ומורידה לפטין (שובע) — קשה יותר לרדת גם עם הדיאטה הכי טובה. נסה השבוע לישון 30 דקות יותר.`,
    }
  }

  const stressDays = habits.filter(h => h.stress >= 4)
  if (stressDays.length >= 3) {
    return {
      title: 'רמת הלחץ שלך גבוהה השבוע',
      body: `${stressDays.length} ימים עם לחץ גבוה. קורטיזול כרוני מעלה תשוקה לפחמימות ומגביר צבירת שומן בטן. שקול/י תרגול נשימה של 5 דקות בבוקר או בערב.`,
    }
  }

  const stepDays = habits.filter(h => h.steps > 0)
  const targetSteps = data.targets?.stepsGoal ?? 8000
  if (stepDays.length > 0) {
    const avgSteps = stepDays.reduce((s, h) => s + h.steps, 0) / stepDays.length
    if (avgSteps < targetSteps * 0.6) {
      return {
        title: 'התנועה היום-יומית שלך נמוכה',
        body: `${Math.round(avgSteps).toLocaleString()} צעדים בממוצע. NEAT הוא 15–30% מההוצאה היומית שלך — הליכה של 15 דקות אחרי כל ארוחה תוסיף כ-2,000 צעדים בקלות.`,
      }
    }
  }

  const water = habits[habits.length - 1]
  if (water && water.waterMl < 1500) {
    return {
      title: 'ההידרציה שלך היום נמוכה מהיעד',
      body: 'כשמעט מים — הגוף מתבלבל בין צמא לרעב. כוס עכשיו יכולה לחסוך התקף חטיף מיותר בעוד שעתיים.',
    }
  }

  return {
    title: 'התוצאות שלך מעולות',
    body: 'שינה טובה, פעילות סבירה, לחץ תחת שליטה. תמשיך/י לנוע באותו קצב. עקביות תמיד מנצחת בהחלט.',
  }
}
