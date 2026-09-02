import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Check, AlertTriangle, User, Compass } from 'lucide-react'
import type {
  Account,
  ActivityLevel,
  DietStyle,
  ExerciseParticipation,
  FastingWindow,
  Goal,
  MeditationParticipation,
  MethodologyKey,
  Sex,
  UserProfile,
} from '../types.ts'
import {
  bmi,
  bmiCategory,
  deadlineFeasibility,
  macros,
  projectedWeeksToGoal,
  targetCalories,
  tdee,
} from '../lib/calculations.ts'
import {
  matchMethodologies,
  type CookingTime,
  type MethodologyAnswers,
  type PastExperience,
  type Priority,
  type ScheduleKind,
  type SocialFrequency,
  type TrackingTolerance,
} from '../lib/methodology-match.ts'
import { createAccount, findAccountByEmail } from '../lib/accounts.ts'

interface Props {
  account: Account
  onComplete: (profile: UserProfile) => void
}

type FormState = Partial<UserProfile>

const STEPS = [
  'ברוכים הבאים',
  'עליך',
  'משקל, יעד וזמן',
  'רמת פעילות',
  'ספורט',
  'מיינדפולנס',
  'סגנון תזונה',
  'חלון אכילה',
  'השיטה שלך',
  'העדפות',
  'התאמות אישיות',
  'התוכנית שלך',
] as const

export function Onboarding({ account, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    accountId: account.id,
    name: account.name,
    sex: 'female',
    activity: 'moderate',
    goal: 'lose_moderate',
    dietStyle: 'balanced',
    fasting: 'none',
    exercise: 'yes',
    meditation: 'yes',
    waterTracking: true,
    allergies: [],
    dislikes: [],
  })

  const stepLabel = STEPS[step]

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return true
      case 1: return !!form.name && !!form.age && !!form.sex && !!form.heightCm
      case 2: return !!form.startWeightKg && !!form.goalWeightKg
      case 3: return !!form.activity
      case 4: return !!form.exercise
      case 5: return !!form.meditation
      case 6: return !!form.dietStyle
      case 7: return !!form.fasting
      case 8: return !!form.methodology
      case 9: return true
      case 10: return true
      case 11: return true
      default: return false
    }
  }, [step, form])

  function finish() {
    const profile: UserProfile = {
      accountId: account.id,
      name: form.name!.trim(),
      age: Number(form.age),
      sex: form.sex as Sex,
      heightCm: Number(form.heightCm),
      startWeightKg: Number(form.startWeightKg),
      currentWeightKg: Number(form.startWeightKg),
      goalWeightKg: Number(form.goalWeightKg),
      deadlineMonths: form.deadlineMonths ? Number(form.deadlineMonths) : undefined,
      motivationEvent: form.motivationEvent?.trim() || undefined,
      motivationEventDate: form.motivationEventDate || undefined,
      activity: form.activity as ActivityLevel,
      goal: form.goal as Goal,
      dietStyle: form.dietStyle as DietStyle,
      fasting: form.fasting as FastingWindow,
      exercise: (form.exercise ?? 'yes') as ExerciseParticipation,
      meditation: (form.meditation ?? 'yes') as MeditationParticipation,
      methodology: form.methodology,
      methodologyReasons: form.methodologyReasons,
      waterTracking: form.waterTracking ?? true,
      allergies: form.allergies ?? [],
      dislikes: form.dislikes ?? [],
      medicalNotes: form.medicalNotes,
      createdAt: new Date().toISOString(),
    }
    onComplete(profile)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{
      background: 'radial-gradient(1200px 700px at 100% -10%, rgba(201, 169, 97, 0.14), transparent 60%), radial-gradient(1000px 500px at 0% 100%, rgba(11, 31, 58, 0.06), transparent 60%), var(--page)',
    }}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--gold-deep)', letterSpacing: '0.2em' }}>
              Harmony · שיטת 5 העמודים
            </span>
          </div>
          <h1 className="serif text-4xl md:text-5xl mb-2">
            <span className="gold-underline">הרמוניה</span>
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            {account.name ? `היי ${account.name.split(' ')[0]} — ` : ''}
            מסע חכם ובר-קיימא לחיים בריאים
          </p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>שלב {step + 1} מתוך {STEPS.length}</span>
            <span>{stepLabel}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="card-elevated p-6 md:p-10 fade-up" key={step}>
          {step === 0 && <StepWelcome name={account.name} onNext={() => setStep(1)} />}
          {step === 1 && <StepAbout form={form} update={update} />}
          {step === 2 && <StepWeight form={form} update={update} />}
          {step === 3 && <StepActivity form={form} update={update} />}
          {step === 4 && <StepExercise form={form} update={update} />}
          {step === 5 && <StepMeditation form={form} update={update} />}
          {step === 6 && <StepDietStyle form={form} update={update} />}
          {step === 7 && <StepFasting form={form} update={update} />}
          {step === 8 && <StepMethodology form={form} update={update} />}
          {step === 9 && <StepAppOptions form={form} update={update} />}
          {step === 10 && <StepPreferences form={form} update={update} />}
          {step === 11 && <StepPlan form={form} account={account} />}

          {step > 0 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>
                <ChevronRight size={16} /> חזרה
              </button>
              {step < STEPS.length - 1 && (
                <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
                  המשך <ChevronLeft size={16} />
                </button>
              )}
              {step === STEPS.length - 1 && (
                <button className="btn btn-gold" onClick={finish}>
                  יאללה, מתחילים <Sparkles size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="text-center py-6">
      <h2 className="text-3xl md:text-4xl mb-4">
        {name ? `ברוך הבא, ${name.split(' ')[0]}` : 'ברוכים הבאים לבית שלכם החדש'}
      </h2>
      <p className="text-base md:text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
        רוב הדיאטות נכשלות. לא בגלל חוסר משמעת — אלא בגלל שהן מטפלות רק בחלק אחד מהתמונה.
        הרמוניה נבנתה על 5 עמודים שעובדים יחד: תזונה, תנועה, שינה, הראש, ומדידה.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {['🥗', '🏃', '😴', '🧠', '📈'].map((emoji, i) => (
          <div key={i} className="p-4 rounded-2xl text-center" style={{ background: 'var(--surface-2)' }}>
            <div className="text-3xl mb-2">{emoji}</div>
            <div className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>
              {['תזונה', 'תנועה', 'שינה', 'ראש', 'מדידה'][i]}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        השאלות הבאות ייקחו כ-2 דקות. אחריהן יהיה לך תוכנית מותאמת אישית מבוססת מדע.
      </p>
      <button className="btn btn-gold" onClick={onNext}>
        בואו נתחיל <ChevronLeft size={16} />
      </button>
    </div>
  )
}

function StepAbout({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 1</span>
        <h2>ספר/י לנו קצת עליך</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">איך לקרוא לך?</label>
          <input className="input" placeholder="השם שלך" value={form.name ?? ''} onChange={e => update('name', e.target.value)} />
        </div>

        <div>
          <label className="label">גיל</label>
          <input className="input" type="number" placeholder="30" value={form.age ?? ''} onChange={e => update('age', Number(e.target.value))} />
        </div>

        <div>
          <label className="label">מין ביולוגי</label>
          <div className="grid grid-cols-2 gap-2">
            {(['female', 'male'] as const).map(s => (
              <button key={s} type="button" onClick={() => update('sex', s)} className={`btn ${form.sex === s ? 'btn-primary' : 'btn-ghost'}`}>
                {s === 'female' ? 'נקבה' : 'זכר'}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="label">גובה (ס"מ)</label>
          <input className="input" type="number" placeholder="170" value={form.heightCm ?? ''} onChange={e => update('heightCm', Number(e.target.value))} />
        </div>
      </div>
    </div>
  )
}

function StepWeight({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const currentBmi = form.startWeightKg && form.heightCm
    ? bmi({ heightCm: Number(form.heightCm), currentWeightKg: Number(form.startWeightKg) })
    : null
  const bmiInfo = currentBmi ? bmiCategory(currentBmi) : null

  const feas = form.startWeightKg && form.goalWeightKg && form.deadlineMonths && form.age && form.heightCm && form.sex && form.activity
    ? deadlineFeasibility({
        name: '', age: Number(form.age), sex: form.sex as Sex,
        heightCm: Number(form.heightCm),
        startWeightKg: Number(form.startWeightKg),
        currentWeightKg: Number(form.startWeightKg),
        goalWeightKg: Number(form.goalWeightKg),
        deadlineMonths: Number(form.deadlineMonths),
        activity: form.activity as ActivityLevel,
        goal: (form.goal ?? 'lose_moderate') as Goal,
        dietStyle: 'balanced', fasting: 'none',
        exercise: 'yes', meditation: 'yes', waterTracking: true,
        allergies: [], dislikes: [],
        createdAt: '',
      })
    : null

  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 2</span>
        <h2>מאיפה, לאן ומתי</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">משקל נוכחי (ק"ג)</label>
          <input className="input" type="number" step="0.1" placeholder="75" value={form.startWeightKg ?? ''} onChange={e => update('startWeightKg', Number(e.target.value))} />
        </div>

        <div>
          <label className="label">משקל יעד (ק"ג)</label>
          <input className="input" type="number" step="0.1" placeholder="68" value={form.goalWeightKg ?? ''} onChange={e => update('goalWeightKg', Number(e.target.value))} />
        </div>

        <div className="md:col-span-2">
          <label className="label">קצב שאיפה</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              { key: 'lose_slow', title: 'אטי ובטוח', desc: 'עד 0.4 ק"ג לשבוע' },
              { key: 'lose_moderate', title: 'מאוזן', desc: '0.4–0.7 ק"ג לשבוע' },
              { key: 'lose_fast', title: 'אינטנסיבי', desc: '0.7–1 ק"ג לשבוע' },
            ] as const).map(opt => (
              <button key={opt.key} type="button" onClick={() => update('goal', opt.key)}
                className="p-4 rounded-2xl text-right border transition-all"
                style={{
                  background: form.goal === opt.key ? 'var(--navy)' : 'var(--surface-1)',
                  color: form.goal === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
                  borderColor: form.goal === opt.key ? 'var(--navy)' : 'var(--border-strong)',
                }}
              >
                <div className="font-semibold mb-1">{opt.title}</div>
                <div className="text-xs opacity-80">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px dashed var(--gold)' }}>
          <label className="label">תוך כמה זמן תרצה להגיע ליעד?</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {[1, 2, 3, 6, 9, 12].map(m => (
              <button key={m} type="button" onClick={() => update('deadlineMonths', m)}
                className={`btn btn-sm ${form.deadlineMonths === m ? 'btn-primary' : 'btn-ghost'}`}
              >
                {m === 1 ? 'חודש' : `${m} חודשים`}
              </button>
            ))}
            <button type="button" onClick={() => update('deadlineMonths', undefined as unknown as number)}
              className={`btn btn-sm ${!form.deadlineMonths ? 'btn-primary' : 'btn-ghost'}`}
            >
              ללא לחץ זמן
            </button>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            אם יש דדליין — נחשב את הגירעון שהוא דורש. אם לא ריאלי, נגיד לך ונציע מסגרת ריאלית.
          </div>
        </div>

        {feas && !feas.feasible && (
          <div className="md:col-span-2 p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(180, 52, 46, 0.08)', border: '1px solid rgba(180, 52, 46, 0.3)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--status-critical)', flexShrink: 0, marginTop: 2 }} />
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
              היעד דורש ירידה של <strong>{feas.requiredWeeklyKg} ק"ג לשבוע</strong> — יותר ממה שבטוח לגוף שלך.
              המקסימום הבטוח: כ-<strong>{feas.maxWeeklyKg} ק"ג לשבוע</strong>. נמליץ להאריך את הדדליין או להתאים את היעד.
            </div>
          </div>
        )}
        {feas && feas.feasible && (
          <div className="md:col-span-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(47, 125, 91, 0.1)', color: 'var(--status-good)' }}>
            ✓ ריאלי — דרוש קצב של {feas.requiredWeeklyKg} ק"ג לשבוע. נסתדר.
          </div>
        )}

        <div className="md:col-span-2">
          <label className="label">יש אירוע קרוב שנותן לך מוטיבציה? (אופציונלי)</label>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="חתונה של אחי / חופש / בדיקה רפואית / יום הולדת"
              value={form.motivationEvent ?? ''} onChange={e => update('motivationEvent', e.target.value)} />
            <input className="input" type="date" placeholder="תאריך האירוע"
              value={form.motivationEventDate ?? ''} onChange={e => update('motivationEventDate', e.target.value)} />
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            עוזר לחזק את ה"למה" — נראה לך אותו בכל פעם שהמוטיבציה יורדת.
          </div>
        </div>

        {currentBmi && bmiInfo && (
          <div className="md:col-span-2 p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>BMI נוכחי</div>
              <div className="font-bold text-xl serif" style={{ color: 'var(--navy)' }}>{currentBmi}</div>
            </div>
            <div className="pill" style={{ background: 'var(--surface-3)' }}>{bmiInfo.label}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepActivity({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const OPTS: { key: ActivityLevel; title: string; desc: string }[] = [
    { key: 'sedentary', title: 'יושבני', desc: 'עבודה משרדית, מעט הליכה' },
    { key: 'light', title: 'קל', desc: 'הליכה קלה 1–2 פעמים בשבוע' },
    { key: 'moderate', title: 'בינוני', desc: 'אימון 3 פעמים בשבוע' },
    { key: 'active', title: 'פעיל', desc: 'אימון 4–5 פעמים בשבוע' },
    { key: 'very_active', title: 'פעיל מאוד', desc: 'ספורטאי / עבודה פיזית' },
  ]
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 3</span>
        <h2>עד כמה פעיל/ה השגרה שלך?</h2>
      </div>
      <div className="grid gap-3">
        {OPTS.map(opt => (
          <button key={opt.key} type="button" onClick={() => update('activity', opt.key)}
            className="p-4 rounded-2xl text-right border flex items-center justify-between transition-all"
            style={{
              background: form.activity === opt.key ? 'var(--navy)' : 'var(--surface-1)',
              color: form.activity === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: form.activity === opt.key ? 'var(--navy)' : 'var(--border-strong)',
            }}
          >
            <div>
              <div className="font-semibold">{opt.title}</div>
              <div className="text-xs opacity-80">{opt.desc}</div>
            </div>
            {form.activity === opt.key && <Check size={20} style={{ color: 'var(--gold)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepExercise({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const OPTS: { key: ExerciseParticipation; title: string; desc: string; emoji: string }[] = [
    { key: 'yes', title: 'כן, אני רוצה תוכנית אימונים', desc: 'אימוני כוח, קרדיו, גמישות — הכל כלול', emoji: '💪' },
    { key: 'limited', title: 'תנועה מוגבלת בלבד', desc: 'הליכה, מתיחות ותנועה קלה — בלי אימונים אינטנסיביים (מגבלה גופנית, גיל, אחרי לידה, אחרי ניתוח)', emoji: '🚶' },
    { key: 'no', title: 'לא מעוניין/ת באימונים כרגע', desc: 'נתמקד בתזונה, שינה ומיינדפולנס. הירידה במשקל תגיע בלי חדר כושר', emoji: '🌿' },
  ]
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 4</span>
        <h2>ספורט — איך זה מתחבר לחיים שלך?</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        אין תשובה נכונה. אימונים עוזרים לתהליך — אבל לא הכרחיים. גם בלי חדר כושר אפשר לרדת במשקל.
      </p>
      <div className="grid gap-3">
        {OPTS.map(opt => (
          <button key={opt.key} type="button" onClick={() => update('exercise', opt.key)}
            className="p-4 rounded-2xl text-right border flex items-center justify-between transition-all gap-3"
            style={{
              background: form.exercise === opt.key ? 'var(--navy)' : 'var(--surface-1)',
              color: form.exercise === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: form.exercise === opt.key ? 'var(--navy)' : 'var(--border-strong)',
            }}
          >
            <div className="flex gap-3 items-start">
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <div className="font-semibold mb-1">{opt.title}</div>
                <div className="text-xs opacity-80">{opt.desc}</div>
              </div>
            </div>
            {form.exercise === opt.key && <Check size={20} style={{ color: 'var(--gold)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepMeditation({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const OPTS: { key: MeditationParticipation; title: string; desc: string; emoji: string }[] = [
    { key: 'yes', title: 'כן, מיינדפולנס חשוב לי', desc: 'תרגילי נשימה, מדיטציה מודרכת, צלילים מרגיעים, יומן הכרת תודה — הכל זמין', emoji: '🧘' },
    { key: 'curious', title: 'סקרן/ית, נסה להראות לי', desc: 'לא בטוח/ה אם זה שלי — נציג בעדינות. אפשר לכבות בכל שלב', emoji: '🤔' },
    { key: 'no', title: 'לא לי — דלג/י על החלק הזה', desc: 'הטאב הזה יוסתר. עדיין נכתוב טיפים על ניהול לחץ ואכילה רגשית', emoji: '⏭️' },
  ]
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 5</span>
        <h2>מיינדפולנס — מעניין אותך?</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        זה עמוד שלם באפליקציה: נשימה, מדיטציה בזמן, צלילים מרגיעים, מדיטציות מודרכות ויומן הכרת תודה. לא כולם אוהבים את זה — וזה בסדר.
      </p>
      <div className="grid gap-3">
        {OPTS.map(opt => (
          <button key={opt.key} type="button" onClick={() => update('meditation', opt.key)}
            className="p-4 rounded-2xl text-right border flex items-center justify-between transition-all gap-3"
            style={{
              background: form.meditation === opt.key ? 'var(--navy)' : 'var(--surface-1)',
              color: form.meditation === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: form.meditation === opt.key ? 'var(--navy)' : 'var(--border-strong)',
            }}
          >
            <div className="flex gap-3 items-start">
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <div className="font-semibold mb-1">{opt.title}</div>
                <div className="text-xs opacity-80">{opt.desc}</div>
              </div>
            </div>
            {form.meditation === opt.key && <Check size={20} style={{ color: 'var(--gold)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDietStyle({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const OPTS: { key: DietStyle; title: string; desc: string; emoji: string }[] = [
    { key: 'balanced', title: 'מאוזן', desc: 'מכל האבות, ללא הגבלות מיוחדות', emoji: '⚖️' },
    { key: 'mediterranean', title: 'ים-תיכוני', desc: 'שמן זית, דגים, קטניות, ירקות', emoji: '🫒' },
    { key: 'high_protein', title: 'עתיר חלבון', desc: 'לשומרי כושר ומאסטרי שריר', emoji: '🥩' },
    { key: 'low_carb', title: 'דל פחמימות', desc: 'פחות סוכר וקמח, יותר שומן וחלבון', emoji: '🥑' },
    { key: 'vegetarian', title: 'צמחוני', desc: 'ללא בשר, כן ביצים ומחלבים', emoji: '🥗' },
    { key: 'vegan', title: 'טבעוני', desc: 'ללא מוצרים מן החי', emoji: '🌱' },
  ]
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 6</span>
        <h2>איזה סגנון תזונה מתאים לך?</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {OPTS.map(opt => (
          <button key={opt.key} type="button" onClick={() => update('dietStyle', opt.key)}
            className="p-4 rounded-2xl text-right border transition-all"
            style={{
              background: form.dietStyle === opt.key ? 'var(--navy)' : 'var(--surface-1)',
              color: form.dietStyle === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: form.dietStyle === opt.key ? 'var(--navy)' : 'var(--border-strong)',
            }}
          >
            <div className="text-2xl mb-2">{opt.emoji}</div>
            <div className="font-semibold mb-1">{opt.title}</div>
            <div className="text-xs opacity-80">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepFasting({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const OPTS: { key: FastingWindow; title: string; desc: string }[] = [
    { key: 'none', title: 'ללא צום', desc: 'אכילה רגילה לאורך היום' },
    { key: '12_12', title: '12/12', desc: '12 שעות אכילה, 12 שעות צום (המלצה בסיסית)' },
    { key: '14_10', title: '14/10', desc: 'חלון אכילה של 10 שעות (למתאמנים)' },
    { key: '16_8', title: '16/8', desc: 'חלון אכילה של 8 שעות (למתקדמים)' },
  ]
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 7</span>
        <h2>חלון אכילה — צום לסירוגין?</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        לא חובה. חלון אכילה מצומצם עוזר לחלק מהאנשים לצמצם קלוריות באופן טבעי.
      </p>
      <div className="grid gap-3">
        {OPTS.map(opt => (
          <button key={opt.key} type="button" onClick={() => update('fasting', opt.key)}
            className="p-4 rounded-2xl text-right border flex items-center justify-between"
            style={{
              background: form.fasting === opt.key ? 'var(--navy)' : 'var(--surface-1)',
              color: form.fasting === opt.key ? 'var(--text-inverse)' : 'var(--navy)',
              borderColor: form.fasting === opt.key ? 'var(--navy)' : 'var(--border-strong)',
            }}
          >
            <div>
              <div className="font-semibold">{opt.title}</div>
              <div className="text-xs opacity-80">{opt.desc}</div>
            </div>
            {form.fasting === opt.key && <Check size={20} style={{ color: 'var(--gold)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

const SCHEDULE_OPTIONS: { key: ScheduleKind; label: string }[] = [
  { key: 'office', label: 'שגרה קבועה (משרד/בית)' },
  { key: 'flexible', label: 'שעות גמישות' },
  { key: 'shifts', label: 'משמרות משתנות' },
  { key: 'travel', label: 'נסיעות עבודה תכופות' },
]
const COOKING_OPTIONS: { key: CookingTime; label: string }[] = [
  { key: 'less_15', label: 'פחות מ-15 דק׳ ליום' },
  { key: '15_30', label: '15–30 דק׳ ליום' },
  { key: 'more_30', label: 'יותר מ-30 דק׳ — אני אוהב לבשל' },
]
const SOCIAL_OPTIONS: { key: SocialFrequency; label: string }[] = [
  { key: 'rare', label: 'כמעט לא אוכל בחוץ' },
  { key: 'weekly', label: '1–2 פעמים בשבוע' },
  { key: 'often', label: '3+ פעמים בשבוע' },
]
const TRACKING_OPTIONS: { key: TrackingTolerance; label: string }[] = [
  { key: 'love_it', label: 'אוהב לעקוב אחרי כל דבר' },
  { key: 'short_term_ok', label: 'בסדר לזמן קצר' },
  { key: 'never', label: 'לא בשבילי — אל תספור בכלל' },
]
const PAST_OPTIONS: { key: PastExperience; label: string }[] = [
  { key: 'never_dieted', label: 'זו הפעם הראשונה שלי' },
  { key: 'tried_and_failed', label: 'ניסיתי כמה פעמים ולא החזיק' },
  { key: 'lost_but_regained', label: 'ירדתי — ואז חזרתי לאותו מקום' },
  { key: 'currently_succeeding', label: 'בתהליך מוצלח, רוצה להעמיק' },
]
const PRIORITY_OPTIONS: { key: Priority; label: string }[] = [
  { key: 'fast_results', label: 'תוצאות מהירות' },
  { key: 'easy_routine', label: 'שגרה קלה שלא נשברת' },
  { key: 'long_term_health', label: 'בריאות לטווח ארוך' },
  { key: 'build_habits', label: 'בניית הרגלים חדשים' },
]

function StepMethodology({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const [answers, setAnswers] = useState<Partial<MethodologyAnswers>>({})

  function pick<K extends keyof MethodologyAnswers>(k: K, v: MethodologyAnswers[K]) {
    setAnswers(prev => ({ ...prev, [k]: v }))
  }

  const complete =
    !!answers.schedule && !!answers.cookingTime && !!answers.socialEating &&
    !!answers.tracking && !!answers.past && !!answers.priority

  const ranked = useMemo(() => {
    if (!complete) return null
    return matchMethodologies(answers as MethodologyAnswers).slice(0, 3)
  }, [complete, answers])

  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 8</span>
        <h2>איזו שיטה הכי מתאימה לך?</h2>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        אין שיטה אחת שעובדת לכולם. 6 שאלות קצרות — ונציג לך את 3 השיטות שהכי מתאימות
        למי שאתה, ולא לפי טרנד. אתה תבחר בסוף.
      </p>

      <div className="space-y-5">
        <MiniPicker label="שגרת העבודה שלך" options={SCHEDULE_OPTIONS} value={answers.schedule} onChange={v => pick('schedule', v)} />
        <MiniPicker label="כמה זמן ביום אתה מוכן להשקיע במטבח?" options={COOKING_OPTIONS} value={answers.cookingTime} onChange={v => pick('cookingTime', v)} />
        <MiniPicker label="כמה פעמים בשבוע אוכלים בחוץ / באירועים?" options={SOCIAL_OPTIONS} value={answers.socialEating} onChange={v => pick('socialEating', v)} />
        <MiniPicker label="מה יחסך למעקב אחרי אוכל?" options={TRACKING_OPTIONS} value={answers.tracking} onChange={v => pick('tracking', v)} />
        <MiniPicker label="הניסיון הקודם שלך" options={PAST_OPTIONS} value={answers.past} onChange={v => pick('past', v)} />
        <MiniPicker label="מה הכי חשוב לך?" options={PRIORITY_OPTIONS} value={answers.priority} onChange={v => pick('priority', v)} />
      </div>

      {ranked && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
            3 השיטות הכי מתאימות לך — בחר אחת
          </div>
          <div className="grid gap-3">
            {ranked.map(({ methodology: m, reasons }, i) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  update('methodology', m.key as MethodologyKey)
                  update('methodologyReasons', reasons)
                }}
                className="p-4 rounded-2xl text-right border transition-all"
                style={{
                  background: form.methodology === m.key ? 'var(--navy)' : 'var(--surface-1)',
                  color: form.methodology === m.key ? 'var(--text-inverse)' : 'var(--navy)',
                  borderColor: form.methodology === m.key ? 'var(--navy)' : 'var(--border-strong)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {i === 0 && <span className="pill pill-gold" style={{ padding: '2px 8px' }}>#1 התאמה</span>}
                  <span className="font-semibold text-lg">{m.name}</span>
                </div>
                <div className="text-xs mb-2 opacity-80">{m.tagline}</div>
                {reasons.length > 0 && (
                  <ul className="text-xs opacity-90 space-y-1">
                    {reasons.map((r, ri) => (
                      <li key={ri} className="flex gap-1 items-start">
                        <Compass size={12} style={{ marginTop: 3, flexShrink: 0 }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>
          <div className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            תוכל להחליף בכל שלב מהפרופיל. השיטה תשפיע על התפריט המומלץ ועל הטיפים שתקבל.
          </div>
        </div>
      )}
    </div>
  )
}

function MiniPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { key: T; label: string }[]
  value: T | undefined
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`btn btn-sm ${value === o.key ? 'btn-primary' : 'btn-ghost'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepAppOptions({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 9</span>
        <h2>העדפות אפליקציה</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--border-strong)' }}>
          <div className="mb-3">
            <div className="font-semibold mb-1">מעקב מים</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              מים לא חובה — אבל הידרציה טובה מפחיתה תחושת רעב מזויפת. תוכל להפעיל או לכבות בכל שלב.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => update('waterTracking', true)}
              className={`btn ${form.waterTracking ? 'btn-primary' : 'btn-ghost'}`}>עוקב אחרי מים</button>
            <button type="button" onClick={() => update('waterTracking', false)}
              className={`btn ${!form.waterTracking ? 'btn-primary' : 'btn-ghost'}`}>בלי מעקב מים</button>
          </div>
        </div>

        <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-2)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>
            שאלה חכמה
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            אחרי שנעבור את זה — האפליקציה תשאל אותך לאישור לשלוח לך תזכורות קצרות (בוקר, צהריים, ערב) לצ׳ק-אין. תמיד אפשר לכבות.
          </p>
        </div>
      </div>
    </div>
  )
}

function StepPreferences({ form, update }: { form: FormState; update: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void }) {
  const [allergyInput, setAllergyInput] = useState('')
  const [dislikeInput, setDislikeInput] = useState('')

  function addTag(field: 'allergies' | 'dislikes', value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    const list = (form[field] ?? []) as string[]
    if (list.includes(trimmed)) return
    update(field, [...list, trimmed])
  }
  function removeTag(field: 'allergies' | 'dislikes', value: string) {
    const list = (form[field] ?? []) as string[]
    update(field, list.filter(v => v !== value))
  }

  return (
    <div>
      <div className="section-title">
        <span className="kicker">שלב 10</span>
        <h2>מה חשוב לדעת עליך?</h2>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="label">אלרגיות / רגישויות</label>
          <div className="flex gap-2 mb-2">
            <input className="input" placeholder="למשל: בוטנים" value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag('allergies', allergyInput); setAllergyInput('') }
              }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => { addTag('allergies', allergyInput); setAllergyInput('') }}>הוסף</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.allergies ?? []).map(tag => (
              <span key={tag} className="pill pill-gold cursor-pointer" onClick={() => removeTag('allergies', tag)}>{tag} ✕</span>
            ))}
          </div>
        </div>

        <div>
          <label className="label">מזונות שאת/ה פחות אוהב/ת</label>
          <div className="flex gap-2 mb-2">
            <input className="input" placeholder="למשל: כרובית" value={dislikeInput}
              onChange={e => setDislikeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag('dislikes', dislikeInput); setDislikeInput('') }
              }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => { addTag('dislikes', dislikeInput); setDislikeInput('') }}>הוסף</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.dislikes ?? []).map(tag => (
              <span key={tag} className="pill pill-sage cursor-pointer" onClick={() => removeTag('dislikes', tag)}>{tag} ✕</span>
            ))}
          </div>
        </div>

        <div>
          <label className="label">הערות רפואיות (אופציונלי)</label>
          <textarea className="textarea" placeholder="למשל: יתר לחץ דם, סוכרת סוג 2, PCOS. המידע נשמר מקומית בלבד."
            value={form.medicalNotes ?? ''} onChange={e => update('medicalNotes', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function StepPlan({ form, account }: { form: FormState; account: Account }) {
  const profile: UserProfile = {
    accountId: account.id,
    name: form.name || '',
    age: Number(form.age) || 30,
    sex: form.sex as Sex,
    heightCm: Number(form.heightCm) || 170,
    startWeightKg: Number(form.startWeightKg) || 75,
    currentWeightKg: Number(form.startWeightKg) || 75,
    goalWeightKg: Number(form.goalWeightKg) || 70,
    deadlineMonths: form.deadlineMonths ? Number(form.deadlineMonths) : undefined,
    motivationEvent: form.motivationEvent,
    motivationEventDate: form.motivationEventDate,
    activity: form.activity as ActivityLevel,
    goal: form.goal as Goal,
    dietStyle: form.dietStyle as DietStyle,
    fasting: form.fasting as FastingWindow,
    exercise: (form.exercise ?? 'yes') as ExerciseParticipation,
    meditation: (form.meditation ?? 'yes') as MeditationParticipation,
    waterTracking: form.waterTracking ?? true,
    allergies: form.allergies ?? [],
    dislikes: form.dislikes ?? [],
    createdAt: new Date().toISOString(),
  }

  const t = macros(profile)
  const totalTdee = tdee(profile)
  const targetKcal = targetCalories(profile)
  const weeks = projectedWeeksToGoal(profile)

  return (
    <div>
      <div className="text-center mb-6">
        <div className="pillar-chip mb-3">
          <Sparkles size={14} /> התוכנית שלך מוכנה
        </div>
        <h2 className="text-3xl mb-2">היי {profile.name.split(' ')[0]}, בנינו לך משהו מיוחד</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          כל המספרים חושבו על בסיס נתוני הגוף והמטרות שלך — לפי משוואת Mifflin-St Jeor.
        </p>
      </div>

      {profile.motivationEvent && (
        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, var(--gold-soft) 0%, var(--cream) 100%)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold-deep)' }}>ה"למה" שלך</div>
          <div className="serif text-xl" style={{ color: 'var(--navy)' }}>{profile.motivationEvent}</div>
          {profile.motivationEventDate && (
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {new Date(profile.motivationEventDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="card-navy">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-2">יעד קלוריות יומי</div>
          <div className="big-number" style={{ color: 'var(--text-inverse)' }}>{t.calories}</div>
          <div className="text-sm mt-2 opacity-80">קק"ל · גירעון של {totalTdee - targetKcal} מתוך {totalTdee}</div>
        </div>

        <div className="card">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>מטרה ריאלית</div>
          <div className="big-number">{weeks ?? '—'}</div>
          <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            שבועות עד היעד ({profile.currentWeightKg} → {profile.goalWeightKg} ק"ג)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <MacroMini label="חלבון" value={`${t.proteinG}g`} color="var(--sage)" />
        <MacroMini label="פחמימות" value={`${t.carbsG}g`} color="var(--gold-deep)" />
        <MacroMini label="שומן" value={`${t.fatG}g`} color="var(--accent-warm)" />
      </div>

      <div className="p-4 rounded-2xl mb-6" style={{ background: 'var(--surface-2)' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>יעדים נוספים</div>
        <div className="grid grid-cols-3 gap-4">
          <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>סיבים</div><div className="font-bold">{t.fiberG}g</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>מים</div><div className="font-bold">{(t.waterMl / 1000).toFixed(1)} ל'</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>צעדים</div><div className="font-bold">{t.stepsGoal.toLocaleString()}</div></div>
        </div>
      </div>

      <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        <User size={12} style={{ display: 'inline', marginLeft: 4 }} />
        החשבון שלך: {account.email} · נשמר על המכשיר עם סיסמה
      </div>
    </div>
  )
}

function MacroMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-2xl text-center border" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="serif text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

// Silence "unused import" — findAccountByEmail is referenced from the Auth
// screen and re-exported through this module boundary in a future step.
export { findAccountByEmail, createAccount }
