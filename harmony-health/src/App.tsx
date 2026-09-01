import { useState } from 'react'
import {
  Home,
  UtensilsCrossed,
  Calendar,
  TrendingUp,
  Dumbbell,
  Heart,
  Sparkles,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react'
import { useAppData } from './hooks/useAppData.ts'
import type { ScreenKey } from './types.ts'
import { Onboarding } from './components/Onboarding.tsx'
import { Dashboard } from './components/Dashboard.tsx'
import { FoodDiary } from './components/FoodDiary.tsx'
import { MealPlan } from './components/MealPlan.tsx'
import { WeightTracker } from './components/WeightTracker.tsx'
import { Workouts } from './components/Workouts.tsx'
import { Habits } from './components/Habits.tsx'
import { MethodPage } from './components/MethodPage.tsx'
import { ProfilePage } from './components/ProfilePage.tsx'

interface NavEntry {
  key: ScreenKey
  label: string
  Icon: typeof Home
}

const NAV: NavEntry[] = [
  { key: 'dashboard', label: 'הבית', Icon: Home },
  { key: 'diary', label: 'יומן אכילה', Icon: UtensilsCrossed },
  { key: 'plan', label: 'תפריט שבועי', Icon: Calendar },
  { key: 'weight', label: 'משקל ומדדים', Icon: TrendingUp },
  { key: 'workouts', label: 'אימונים', Icon: Dumbbell },
  { key: 'habits', label: 'הרגלים ורווחה', Icon: Heart },
  { key: 'method', label: 'השיטה', Icon: Sparkles },
  { key: 'profile', label: 'פרופיל', Icon: UserIcon },
]

export default function App() {
  const data = useAppData()
  const [screen, setScreen] = useState<ScreenKey>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!data.profile) {
    return <Onboarding onComplete={data.setProfile} />
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-0 right-0 h-screen w-72 border-l bg-white z-40`}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--gold-deep)', letterSpacing: '0.2em' }}>
                Harmony
              </div>
              <h1 className="serif text-2xl mt-1">הרמוניה</h1>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                שיטת 5 העמודים
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--navy)' }}
              aria-label="סגור תפריט"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setScreen(key); setMobileOpen(false) }}
                className={`nav-item ${screen === key ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 p-4 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>ההתקדמות שלך</div>
            <div className="serif text-2xl mt-1" style={{ color: 'var(--navy)' }}>
              {data.profile.name.split(' ')[0]}
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              המשקל הנוכחי: <strong>{data.profile.currentWeightKg} ק"ג</strong>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              יעד: <strong>{data.profile.goalWeightKg} ק"ג</strong>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <div>
            <div className="text-xs tracking-widest font-bold" style={{ color: 'var(--gold-deep)', letterSpacing: '0.2em' }}>Harmony</div>
            <div className="serif text-lg" style={{ color: 'var(--navy)' }}>הרמוניה</div>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--navy)' }}
            aria-label="פתח תפריט"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="p-4 md:p-10 max-w-6xl mx-auto fade-up" key={screen}>
          {screen === 'dashboard' && <Dashboard data={data} onNavigate={setScreen} />}
          {screen === 'diary' && <FoodDiary data={data} />}
          {screen === 'plan' && <MealPlan data={data} />}
          {screen === 'weight' && <WeightTracker data={data} />}
          {screen === 'workouts' && <Workouts data={data} />}
          {screen === 'habits' && <Habits data={data} />}
          {screen === 'method' && <MethodPage />}
          {screen === 'profile' && <ProfilePage data={data} />}
        </div>
      </main>
    </div>
  )
}
