import { useMemo } from 'react'
import { Flame, Droplet, Footprints, Utensils, Moon, Brain, Activity, Sparkles, ChevronLeft } from 'lucide-react'
import type { ScreenKey } from '../types.ts'
import type { useAppData } from '../hooks/useAppData.ts'
import { FOODS } from '../data/foods.ts'
import { todayIso } from '../lib/storage.ts'
import { PILLARS } from '../lib/methodology.ts'
import { projectedWeeksToGoal, tdee } from '../lib/calculations.ts'
import { MiniChart } from './MiniChart.tsx'

interface Props {
  data: ReturnType<typeof useAppData>
  onNavigate: (s: ScreenKey) => void
}

export function Dashboard({ data, onNavigate }: Props) {
  const today = todayIso()
  const targets = data.targets!
  const profile = data.profile!

  const todayDiary = useMemo(() => data.diary.filter(d => d.date === today), [data.diary, today])
  const todayHabit = useMemo(() => data.habits.find(h => h.date === today), [data.habits, today])
  const todayWorkouts = useMemo(() => data.workouts.filter(w => w.date === today), [data.workouts, today])

  const consumed = useMemo(() => {
    return todayDiary.reduce(
      (acc, entry) => {
        const food = FOODS.find(f => f.id === entry.foodId)
        if (!food) return acc
        acc.kcal += food.kcal * entry.servings
        acc.protein += food.protein * entry.servings
        acc.carbs += food.carbs * entry.servings
        acc.fat += food.fat * entry.servings
        acc.fiber += food.fiber * entry.servings
        return acc
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    )
  }, [todayDiary])

  const remaining = Math.max(targets.calories - Math.round(consumed.kcal), 0)
  const totalTdee = tdee(profile)
  const weeksToGoal = projectedWeeksToGoal(profile)

  const recentWeights = useMemo(() => {
    return [...data.weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  }, [data.weights])

  const chartData = recentWeights.map(w => ({ label: w.date.slice(5), value: w.weightKg }))

  const totalLost = profile.startWeightKg - profile.currentWeightKg
  const goalDistance = profile.currentWeightKg - profile.goalWeightKg
  const journeyProgress = totalLost / Math.max(profile.startWeightKg - profile.goalWeightKg, 0.01) * 100

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--gold-deep)', letterSpacing: '0.2em' }}>
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 className="text-3xl md:text-4xl mb-2">בוקר טוב, {profile.name.split(' ')[0]}</h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          המסע שלך מתקדם — {totalLost > 0 ? `כבר ירדת ${totalLost.toFixed(1)} ק"ג` : 'מוכן/ה ליום מוצלח'}
        </p>
      </div>

      {/* Hero: today's energy budget */}
      <div className="card-navy mb-6">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80 mb-2">נשאר לאכול היום</div>
            <div className="big-number" style={{ color: 'var(--text-inverse)' }}>{remaining.toLocaleString()}</div>
            <div className="text-sm mt-1 opacity-80">מתוך {targets.calories.toLocaleString()} קק"ל</div>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label="חלבון" current={consumed.protein} target={targets.proteinG} unit="g" color="sage" />
              <MacroBar label="פחמימות" current={consumed.carbs} target={targets.carbsG} unit="g" color="warm" />
              <MacroBar label="שומן" current={consumed.fat} target={targets.fatG} unit="g" color="cool" />
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <button className="btn btn-gold btn-sm" onClick={() => onNavigate('diary')}>
                <Utensils size={14} /> הוסף ארוחה
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('plan')} style={{ color: 'var(--text-inverse)', borderColor: 'rgba(250, 247, 240, 0.3)' }}>
                תפריט מוצע
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} style={{ color: 'var(--gold)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>אנרגיה</span>
          </div>
          <div className="serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>{Math.round(consumed.kcal).toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>קק"ל נצרכו · TDEE משוער {totalTdee.toLocaleString()}</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Droplet size={18} style={{ color: 'var(--accent-cool)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>הידרציה</span>
          </div>
          <div className="serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            {((todayHabit?.waterMl ?? 0) / 1000).toFixed(1)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>מתוך {(targets.waterMl / 1000).toFixed(1)} ליטר</div>
          <div className="progress-track mt-3" style={{ height: 6 }}>
            <div className="progress-fill cool" style={{ width: `${Math.min(100, ((todayHabit?.waterMl ?? 0) / targets.waterMl) * 100)}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Footprints size={18} style={{ color: 'var(--sage-deep)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>תנועה</span>
          </div>
          <div className="serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            {(todayHabit?.steps ?? 0).toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>צעדים · יעד {targets.stepsGoal.toLocaleString()}</div>
          <div className="progress-track mt-3" style={{ height: 6 }}>
            <div className="progress-fill sage" style={{ width: `${Math.min(100, ((todayHabit?.steps ?? 0) / targets.stepsGoal) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Journey + chart */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold-deep)' }}>מסלול המשקל</div>
              <h3 className="text-xl">14 הימים האחרונים</h3>
            </div>
            <button className="btn btn-ghost btn-xs" onClick={() => onNavigate('weight')}>
              פרטים <ChevronLeft size={12} />
            </button>
          </div>
          {chartData.length > 1 ? (
            <MiniChart data={chartData} height={200} color="#C9A961" />
          ) : (
            <div className="p-6 text-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                עדיין לא רשמת שקילות. נסה לשקול היום ולראות את המסע מתחיל.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('weight')}>
                רשום שקילה ראשונה
              </button>
            </div>
          )}
        </div>

        <div className="card-elevated p-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>המסע ליעד</div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            {goalDistance > 0 ? `${goalDistance.toFixed(1)} ק"ג` : '🎉 הגעת!'}
          </div>
          <div className="text-xs mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
            {goalDistance > 0 ? `נותרו עד ${profile.goalWeightKg} ק"ג` : 'יעד הושג!'}
          </div>
          <div className="progress-track mb-3">
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, journeyProgress))}%` }} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {weeksToGoal !== null && weeksToGoal > 0
              ? `הערכה: ${weeksToGoal} שבועות בקצב הנוכחי`
              : 'התאמת קלוריות אוטומטית מתעדכנת מדי שבוע'}
          </div>
        </div>
      </div>

      {/* Pillars quick view */}
      <div className="mb-6">
        <div className="section-title">
          <span className="kicker">היום · לפי 5 העמודים</span>
          <h2>איפה אנחנו עומדים?</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <PillarStatus pillar="nutrition" icon={<Utensils size={18} />} progress={Math.min(100, (consumed.kcal / targets.calories) * 100)} label="תזונה" onClick={() => onNavigate('diary')} />
          <PillarStatus pillar="movement" icon={<Activity size={18} />} progress={Math.min(100, (todayWorkouts.reduce((s, w) => s + w.minutes, 0) / 30) * 100)} label="תנועה" onClick={() => onNavigate('workouts')} />
          <PillarStatus pillar="sleep" icon={<Moon size={18} />} progress={Math.min(100, ((todayHabit?.sleepHours ?? 0) / 8) * 100)} label="שינה" onClick={() => onNavigate('habits')} />
          <PillarStatus pillar="mind" icon={<Brain size={18} />} progress={Math.min(100, ((todayHabit?.mindfulnessMinutes ?? 0) / 10) * 100)} label="ראש" onClick={() => onNavigate('habits')} />
          <PillarStatus pillar="measure" icon={<Sparkles size={18} />} progress={data.weights.some(w => w.date === today) ? 100 : 0} label="מדידה" onClick={() => onNavigate('weight')} />
        </div>
      </div>

      {/* Method blurb */}
      <div className="card" style={{ background: 'var(--surface-2)', border: '1px dashed var(--gold)' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl" style={{ background: 'var(--navy)', color: 'var(--gold)' }}>
            <Sparkles size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg mb-1">טיפ יומי · {PILLARS[new Date().getDate() % 5].title}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {PILLARS[new Date().getDate() % 5].principles[new Date().getDate() % 3]}
            </p>
            <button className="btn btn-ghost btn-xs" onClick={() => onNavigate('method')}>
              קרא/י יותר על השיטה <ChevronLeft size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MacroBar({ label, current, target, unit, color }: {
  label: string
  current: number
  target: number
  unit: string
  color: 'sage' | 'warm' | 'cool' | 'navy'
}) {
  const pct = Math.min(100, (current / target) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-inverse)' }}>
        <span className="opacity-80">{label}</span>
        <span className="font-bold">{Math.round(current)}/{target}{unit}</span>
      </div>
      <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PillarStatus({ icon, progress, label, onClick }: {
  pillar: string
  icon: React.ReactNode
  progress: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card text-right transition-all hover:shadow-md"
      style={{ padding: 16 }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--navy)' }}>
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="progress-track" style={{ height: 6 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{Math.round(progress)}%</div>
    </button>
  )
}
