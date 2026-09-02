import { useEffect, useState } from 'react'
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
  Wind,
  Lightbulb,
  LogOut,
} from 'lucide-react'
import { useAppData } from './hooks/useAppData.ts'
import type { Account, ScreenKey } from './types.ts'
import { Auth } from './components/Auth.tsx'
import { Onboarding } from './components/Onboarding.tsx'
import { Dashboard } from './components/Dashboard.tsx'
import { FoodDiary } from './components/FoodDiary.tsx'
import { MealPlan } from './components/MealPlan.tsx'
import { WeightTracker } from './components/WeightTracker.tsx'
import { Workouts } from './components/Workouts.tsx'
import { Habits } from './components/Habits.tsx'
import { Mindfulness } from './components/Mindfulness.tsx'
import { Tips } from './components/Tips.tsx'
import { MethodPage } from './components/MethodPage.tsx'
import { ProfilePage } from './components/ProfilePage.tsx'
import { currentAccount, logout } from './lib/accounts.ts'

interface NavEntry {
  key: ScreenKey
  label: string
  Icon: typeof Home
  hiddenIfNoExercise?: boolean
  hiddenIfNoMeditation?: boolean
}

const NAV: NavEntry[] = [
  { key: 'dashboard', label: 'הבית', Icon: Home },
  { key: 'diary', label: 'יומן אכילה', Icon: UtensilsCrossed },
  { key: 'plan', label: 'תפריט שבועי', Icon: Calendar },
  { key: 'weight', label: 'משקל ומדדים', Icon: TrendingUp },
  { key: 'workouts', label: 'אימונים', Icon: Dumbbell, hiddenIfNoExercise: true },
  { key: 'mindfulness', label: 'מיינדפולנס', Icon: Wind, hiddenIfNoMeditation: true },
  { key: 'habits', label: 'הרגלים ורווחה', Icon: Heart },
  { key: 'tips', label: 'טיפים והגיגים', Icon: Lightbulb },
  { key: 'method', label: 'השיטה', Icon: Sparkles },
  { key: 'profile', label: 'פרופיל', Icon: UserIcon },
]

export default function App() {
  const [account, setAccount] = useState<Account | null>(() => currentAccount())
  const data = useAppData(account?.id ?? null)
  const [screen, setScreen] = useState<ScreenKey>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setScreen('dashboard')
  }, [account?.id])

  if (!account) {
    return <Auth onAuthenticated={setAccount} />
  }

  if (!data.profile) {
    return <Onboarding account={account} onComplete={data.setProfile} />
  }

  function handleLogout() {
    logout()
    setAccount(null)
  }

  const showWorkouts = data.profile.exercise !== 'no'
  const showMeditation = data.profile.meditation !== 'no'
  const nav = NAV.filter(n =>
    !(n.hiddenIfNoExercise && !showWorkouts) &&
    !(n.hiddenIfNoMeditation && !showMeditation)
  )

  return (
    <div className="min-h-screen flex" dir="rtl">
      <aside
        className={`${mobileOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-0 right-0 h-screen w-72 border-l bg-white z-40 overflow-y-auto`}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="p-6 flex flex-col min-h-full">
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
            {nav.map(({ key, label, Icon }) => (
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

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              מחובר בתור
            </div>
            <div className="text-sm mb-3 truncate" style={{ color: 'var(--navy)' }} title={account.email}>
              {account.email}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm w-full"
            >
              <LogOut size={14} /> התנתק
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0">
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
          {screen === 'workouts' && showWorkouts && <Workouts data={data} />}
          {screen === 'workouts' && !showWorkouts && <NoExerciseNotice />}
          {screen === 'mindfulness' && showMeditation && <Mindfulness data={data} />}
          {screen === 'mindfulness' && !showMeditation && <NoMeditationNotice />}
          {screen === 'habits' && <Habits data={data} />}
          {screen === 'tips' && <Tips data={data} />}
          {screen === 'method' && <MethodPage data={data} />}
          {screen === 'profile' && <ProfilePage data={data} account={account} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  )
}

function NoExerciseNotice() {
  return (
    <div className="card text-center py-10">
      <div className="text-4xl mb-3">🌿</div>
      <h2 className="text-2xl mb-2">בחרת בשקט מהאימונים</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
        אין בעיה — התוכנית שלך עדיין תעבוד. אם תרצה להוסיף פעילות בעתיד, שנה את ההעדפה בפרופיל.
      </p>
    </div>
  )
}

function NoMeditationNotice() {
  return (
    <div className="card text-center py-10">
      <div className="text-4xl mb-3">🧘</div>
      <h2 className="text-2xl mb-2">בחרת לוותר על מיינדפולנס</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
        לא בעיה — התוכנית שלך תעבוד גם ככה. אם תרצה להתנסות בעתיד, שנה את ההעדפה בפרופיל.
      </p>
    </div>
  )
}
