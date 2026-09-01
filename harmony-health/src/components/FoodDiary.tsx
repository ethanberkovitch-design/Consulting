import { useMemo, useState } from 'react'
import { Search, Plus, Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react'
import type { DiaryEntry, FoodItem } from '../types.ts'
import type { useAppData } from '../hooks/useAppData.ts'
import { FOODS, FOOD_CATEGORIES } from '../data/foods.ts'
import { todayIso } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

const MEAL_META = {
  breakfast: { label: 'ארוחת בוקר', icon: Coffee, color: 'var(--gold)' },
  lunch: { label: 'ארוחת צהריים', icon: Sun, color: 'var(--accent-warm)' },
  dinner: { label: 'ארוחת ערב', icon: Moon, color: 'var(--navy-3)' },
  snack: { label: 'חטיף', icon: Cookie, color: 'var(--sage)' },
} as const

export function FoodDiary({ data }: Props) {
  const [date, setDate] = useState(todayIso())
  const [addingTo, setAddingTo] = useState<DiaryEntry['meal'] | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('הכול')
  const targets = data.targets!

  const dayEntries = useMemo(
    () => data.diary.filter(e => e.date === date),
    [data.diary, date],
  )

  const consumed = useMemo(() => {
    return dayEntries.reduce((acc, e) => {
      const f = FOODS.find(x => x.id === e.foodId)
      if (!f) return acc
      return {
        kcal: acc.kcal + f.kcal * e.servings,
        protein: acc.protein + f.protein * e.servings,
        carbs: acc.carbs + f.carbs * e.servings,
        fat: acc.fat + f.fat * e.servings,
        fiber: acc.fiber + f.fiber * e.servings,
      }
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }, [dayEntries])

  const filtered = useMemo(() => {
    let list = FOODS
    if (category !== 'הכול') list = list.filter(f => f.category === category)
    if (search.trim()) {
      const q = search.trim()
      list = list.filter(f => f.name.includes(q) || f.category.includes(q))
    }
    return list
  }, [search, category])

  function add(food: FoodItem, meal: DiaryEntry['meal'], servings: number) {
    data.addDiary({ date, meal, foodId: food.id, servings })
    setAddingTo(null)
    setSearch('')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
            עמוד 1 · תזונה חכמה
          </div>
          <h1 className="text-3xl md:text-4xl">יומן אכילה</h1>
        </div>
        <input
          type="date"
          className="input"
          style={{ width: 'auto' }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="card-navy mb-6">
        <div className="grid md:grid-cols-5 gap-4 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">קלוריות</div>
            <div className="serif text-3xl font-bold" style={{ color: 'var(--text-inverse)' }}>{Math.round(consumed.kcal)}</div>
            <div className="text-xs opacity-70">מתוך {targets.calories}</div>
          </div>
          <MacroBox label="חלבון" value={consumed.protein} target={targets.proteinG} color="sage" />
          <MacroBox label="פחמימות" value={consumed.carbs} target={targets.carbsG} color="warm" />
          <MacroBox label="שומן" value={consumed.fat} target={targets.fatG} color="cool" />
          <MacroBox label="סיבים" value={consumed.fiber} target={targets.fiberG} color="navy" />
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {(Object.keys(MEAL_META) as (keyof typeof MEAL_META)[]).map(meal => {
          const meta = MEAL_META[meal]
          const Icon = meta.icon
          const entries = dayEntries.filter(e => e.meal === meal)
          const mealKcal = entries.reduce((s, e) => {
            const f = FOODS.find(x => x.id === e.foodId)
            return s + (f ? f.kcal * e.servings : 0)
          }, 0)
          return (
            <div key={meal} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ background: meta.color, color: 'var(--text-inverse)' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{meta.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(mealKcal)} קק"ל</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingTo(meal)}>
                  <Plus size={14} /> הוסף
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  עדיין לא רשמת פריטים לארוחה הזו
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map(entry => {
                    const food = FOODS.find(f => f.id === entry.foodId)
                    if (!food) return null
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                        <div>
                          <div className="font-semibold">{food.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {entry.servings} × {food.servingLabel} · {Math.round(food.kcal * entry.servings)} קק"ל · חלבון {(food.protein * entry.servings).toFixed(1)}g
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => data.removeDiary(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                          style={{ color: 'var(--status-critical)' }}
                          aria-label="מחק"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {addingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setAddingTo(null)}>
          <div className="bg-white w-full max-w-2xl rounded-t-3xl md:rounded-3xl p-6 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-2xl mb-1">הוספה ל{MEAL_META[addingTo].label}</h3>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>חפש/י מזון או בחר/י מהקטגוריות</div>
            </div>

            <div className="mb-3 relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input pr-10"
                placeholder="שם מזון..."
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {FOOD_CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`pill ${category === c ? 'pill-navy' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 -mx-2 px-2">
              {filtered.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  לא נמצאו תוצאות
                </div>
              )}
              <div className="space-y-2">
                {filtered.slice(0, 50).map(food => (
                  <FoodPickRow key={food.id} food={food} onAdd={(s) => add(food, addingTo, s)} />
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-ghost w-full" onClick={() => setAddingTo(null)}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FoodPickRow({ food, onAdd }: { food: FoodItem; onAdd: (servings: number) => void }) {
  const [servings, setServings] = useState(1)
  return (
    <div className="p-3 rounded-xl flex items-center justify-between gap-2" style={{ background: 'var(--surface-2)' }}>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{food.name}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {food.servingLabel} · {food.kcal} קק"ל · חלבון {food.protein}g
        </div>
      </div>
      <input
        type="number"
        step="0.5"
        min="0.5"
        className="input"
        value={servings}
        onChange={e => setServings(Number(e.target.value))}
        style={{ width: 70 }}
      />
      <button className="btn btn-primary btn-sm" onClick={() => onAdd(servings)}>
        <Plus size={14} />
      </button>
    </div>
  )
}

function MacroBox({ label, value, target, color }: { label: string; value: number; target: number; color: 'sage' | 'warm' | 'cool' | 'navy' }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest opacity-80 mb-1">{label}</div>
      <div className="font-bold text-lg mb-1" style={{ color: 'var(--text-inverse)' }}>
        {Math.round(value)}/{target}g
      </div>
      <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)', height: 6 }}>
        <div className={`progress-fill ${color}`} style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
      </div>
    </div>
  )
}
