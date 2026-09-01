import { useMemo, useState } from 'react'
import { Clock, ChefHat, Utensils, Sparkles, RefreshCw } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import { planWeek, type DayPlan } from '../lib/mealPlanner.ts'

interface Props { data: ReturnType<typeof useAppData> }

const DAY_NAMES = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']

export function MealPlan({ data }: Props) {
  const profile = data.profile!
  const targets = data.targets!
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDay, setSelectedDay] = useState(0)

  const week = useMemo(
    () => planWeek(targets, profile.dietStyle, profile.dislikes, refreshKey),
    [targets, profile.dietStyle, profile.dislikes, refreshKey],
  )

  const day = week[selectedDay]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
            תפריט מותאם אישית
          </div>
          <h1 className="text-3xl md:text-4xl">התוכנית של השבוע</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            מבוסס על סגנון <strong>{styleLabel(profile.dietStyle)}</strong> ויעד של {targets.calories} קק"ל ליום
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setRefreshKey(k => k + 1)}>
          <RefreshCw size={14} /> תפריט חדש
        </button>
      </div>

      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {DAY_NAMES.map((name, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-3 rounded-2xl whitespace-nowrap border transition-all min-w-[110px] ${
              selectedDay === i ? 'shadow-md' : ''
            }`}
            style={{
              background: selectedDay === i ? 'var(--navy)' : 'var(--surface-1)',
              color: selectedDay === i ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: selectedDay === i ? 'var(--navy)' : 'var(--border)',
            }}
          >
            <div className="text-xs opacity-80">יום {i + 1}</div>
            <div className="font-semibold text-sm">{name}</div>
            <div className="text-xs opacity-70 mt-1">{week[i].totalKcal} קק"ל</div>
          </button>
        ))}
      </div>

      {/* Day plan */}
      <div className="card-navy mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">סיכום יומי</div>
            <div className="serif text-2xl font-bold" style={{ color: 'var(--text-inverse)' }}>
              {day.totalKcal} קק"ל
            </div>
          </div>
          <div className="text-sm opacity-80 text-left">
            חלבון {day.totalProtein}g · פחמימות {day.totalCarbs}g · שומן {day.totalFat}g
          </div>
        </div>
        <MacroStrip label="חלבון" value={day.totalProtein} target={targets.proteinG} />
      </div>

      <div className="grid gap-4">
        <MealCard title="ארוחת בוקר" recipe={day.breakfast} />
        <MealCard title="ארוחת צהריים" recipe={day.lunch} />
        <MealCard title="ארוחת ערב" recipe={day.dinner} />
        {day.snacks.map(s => <MealCard key={s.id} title="חטיף" recipe={s} />)}
      </div>

      <div className="card mt-6" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-start gap-3">
          <Sparkles size={20} style={{ color: 'var(--gold-deep)' }} />
          <div>
            <div className="font-semibold mb-1">איך זה עובד</div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              המחולל בונה תפריט שמכוון ליעד הקלוריות שלך עם דגש על חלבון גבוה ואי-חזרתיות. הוא מסנן
              מזונות שסימנת כלא-אהובים ומעדיף מנות שמתאימות לסגנון התזונה שבחרת. תלחצו "תפריט חדש"
              כדי לקבל וריאציה, או תרשמו את הארוחות ביומן כדי לעקוב.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MealCard({ title, recipe }: { title: string; recipe: DayPlan['breakfast'] }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold-deep)' }}>
            {title}
          </div>
          <h3 className="text-xl mt-1">{recipe.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="pill"><Clock size={12} /> {recipe.timeMin} דקות</span>
            <span className="pill pill-gold">{recipe.kcal} קק"ל</span>
            <span className="pill pill-sage">חלבון {recipe.protein}g</span>
            {recipe.tags.slice(0, 2).map(t => <span key={t} className="pill">{t}</span>)}
          </div>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'סגור' : 'מתכון'}
        </button>
      </div>

      {expanded && (
        <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChefHat size={16} style={{ color: 'var(--gold-deep)' }} />
              <div className="font-semibold text-sm">מרכיבים</div>
            </div>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--gold)' }}>◆</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Utensils size={16} style={{ color: 'var(--gold-deep)' }} />
              <div className="font-semibold text-sm">אופן הכנה</div>
            </div>
            <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="pill pill-navy" style={{ width: 22, height: 22, padding: 0, justifyContent: 'center' }}>{i + 1}</span>
                  <span className="flex-1 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function MacroStrip({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, (value / target) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 opacity-80">
        <span>{label}</span>
        <span>{value}/{target}g</span>
      </div>
      <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)', height: 8 }}>
        <div className="progress-fill sage" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function styleLabel(s: string): string {
  const map: Record<string, string> = {
    balanced: 'מאוזן',
    mediterranean: 'ים-תיכוני',
    low_carb: 'דל פחמימות',
    high_protein: 'עתיר חלבון',
    vegetarian: 'צמחוני',
    vegan: 'טבעוני',
  }
  return map[s] ?? s
}
