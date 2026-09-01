import { useState } from 'react'
import { User, Target, Salad, Clock, AlertTriangle, LogOut, Save, Wind, Calendar as CalendarIcon, Mail } from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import type {
  Account,
  ActivityLevel,
  DietStyle,
  ExerciseParticipation,
  FastingWindow,
  Goal,
  MeditationParticipation,
  UserProfile,
} from '../types.ts'
import { bmi, macros, tdee } from '../lib/calculations.ts'

interface Props {
  data: ReturnType<typeof useAppData>
  account: Account
  onLogout: () => void
}

export function ProfilePage({ data, account, onLogout }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UserProfile>(data.profile!)

  function save() {
    data.setProfile(form)
    setEditing(false)
  }

  function reset() {
    if (confirm('לאפס את כל הנתונים? הפעולה בלתי-הפיכה.')) {
      data.resetAll()
    }
  }

  const currentBmi = bmi(form)
  const t = macros(form)
  const totalTdee = tdee(form)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
            הפרופיל שלי
          </div>
          <h1 className="text-3xl md:text-4xl">{data.profile!.name}</h1>
        </div>
        {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>ערוך</button>}
      </div>

      {/* Account */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center serif text-xl font-bold"
              style={{ background: 'var(--navy)', color: 'var(--gold)' }}
            >
              {account.name.trim().charAt(0)}
            </div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--navy)' }}>{account.name}</div>
              <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }} dir="ltr">
                <Mail size={12} /> {account.email}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                חשבון נוצר ב-{new Date(account.createdAt).toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            <LogOut size={14} /> התנתק
          </button>
        </div>
      </div>

      {/* Snapshot */}
      <div className="card-navy mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">משקל</div>
            <div className="big-number" style={{ color: 'var(--text-inverse)' }}>{form.currentWeightKg}</div>
            <div className="text-xs opacity-80">ק"ג · יעד {form.goalWeightKg}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">BMI</div>
            <div className="serif text-3xl font-bold" style={{ color: 'var(--text-inverse)' }}>{currentBmi}</div>
            <div className="text-xs opacity-80">אינדקס מסת גוף</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">TDEE</div>
            <div className="serif text-3xl font-bold" style={{ color: 'var(--text-inverse)' }}>{totalTdee}</div>
            <div className="text-xs opacity-80">הוצאה יומית משוערת</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">יעד קלוריות</div>
            <div className="serif text-3xl font-bold" style={{ color: 'var(--gold)' }}>{t.calories}</div>
            <div className="text-xs opacity-80">קק"ל ליום</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Section icon={<User size={16} />} title="פרטים אישיים">
          <Row label="גיל">{editing ? <input type="number" className="input" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} /> : `${form.age}`}</Row>
          <Row label="מין">{editing ? (
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, sex: s })} className={`btn ${form.sex === s ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
                  {s === 'female' ? 'נקבה' : 'זכר'}
                </button>
              ))}
            </div>
          ) : (form.sex === 'female' ? 'נקבה' : 'זכר')}</Row>
          <Row label="גובה">{editing ? <input type="number" className="input" value={form.heightCm} onChange={e => setForm({ ...form, heightCm: Number(e.target.value) })} /> : `${form.heightCm} ס"מ`}</Row>
        </Section>

        <Section icon={<Target size={16} />} title="יעדים">
          <Row label="משקל נוכחי">
            {editing ? <input type="number" step="0.1" className="input" value={form.currentWeightKg} onChange={e => setForm({ ...form, currentWeightKg: Number(e.target.value) })} /> : `${form.currentWeightKg} ק"ג`}
          </Row>
          <Row label="משקל יעד">
            {editing ? <input type="number" step="0.1" className="input" value={form.goalWeightKg} onChange={e => setForm({ ...form, goalWeightKg: Number(e.target.value) })} /> : `${form.goalWeightKg} ק"ג`}
          </Row>
          <Row label="קצב יעד">
            {editing ? (
              <select className="select" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value as Goal })}>
                <option value="lose_slow">ירידה אטית</option>
                <option value="lose_moderate">ירידה מאוזנת</option>
                <option value="lose_fast">ירידה מהירה</option>
                <option value="maintain">שימור משקל</option>
                <option value="recomposition">רה-קומפוזיציה</option>
              </select>
            ) : goalLabel(form.goal)}
          </Row>
          <Row label="לו״ז יעד">
            {editing ? (
              <select
                className="select"
                value={form.deadlineMonths ?? 0}
                onChange={e => {
                  const v = Number(e.target.value)
                  setForm({ ...form, deadlineMonths: v > 0 ? v : undefined })
                }}
              >
                <option value={0}>ללא דד-ליין</option>
                <option value={1}>חודש</option>
                <option value={2}>חודשיים</option>
                <option value={3}>3 חודשים</option>
                <option value={6}>6 חודשים</option>
                <option value={9}>9 חודשים</option>
                <option value={12}>שנה</option>
              </select>
            ) : (form.deadlineMonths ? `${form.deadlineMonths} חודשים` : 'ללא דד-ליין')}
          </Row>
        </Section>

        <Section icon={<CalendarIcon size={16} />} title="מוטיבציה">
          <Row label="אירוע שמניע אותך">
            {editing ? (
              <input
                className="input"
                placeholder="חתונה, יום הולדת, בדיקה רפואית…"
                value={form.motivationEvent ?? ''}
                onChange={e => setForm({ ...form, motivationEvent: e.target.value || undefined })}
              />
            ) : (form.motivationEvent || '—')}
          </Row>
          <Row label="תאריך האירוע">
            {editing ? (
              <input
                className="input"
                type="date"
                value={form.motivationEventDate ?? ''}
                onChange={e => setForm({ ...form, motivationEventDate: e.target.value || undefined })}
              />
            ) : (form.motivationEventDate ? new Date(form.motivationEventDate).toLocaleDateString('he-IL') : '—')}
          </Row>
        </Section>

        <Section icon={<Salad size={16} />} title="תזונה">
          <Row label="סגנון">
            {editing ? (
              <select className="select" value={form.dietStyle} onChange={e => setForm({ ...form, dietStyle: e.target.value as DietStyle })}>
                <option value="balanced">מאוזן</option>
                <option value="mediterranean">ים-תיכוני</option>
                <option value="high_protein">עתיר חלבון</option>
                <option value="low_carb">דל פחמימות</option>
                <option value="vegetarian">צמחוני</option>
                <option value="vegan">טבעוני</option>
              </select>
            ) : dietStyleLabel(form.dietStyle)}
          </Row>
          <Row label="חלון אכילה">
            {editing ? (
              <select className="select" value={form.fasting} onChange={e => setForm({ ...form, fasting: e.target.value as FastingWindow })}>
                <option value="none">ללא צום</option>
                <option value="12_12">12/12</option>
                <option value="14_10">14/10</option>
                <option value="16_8">16/8</option>
              </select>
            ) : fastingLabel(form.fasting)}
          </Row>
        </Section>

        <Section icon={<Clock size={16} />} title="פעילות">
          <Row label="רמת פעילות">
            {editing ? (
              <select className="select" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value as ActivityLevel })}>
                <option value="sedentary">יושבנית</option>
                <option value="light">קלה</option>
                <option value="moderate">בינונית</option>
                <option value="active">פעילה</option>
                <option value="very_active">פעילה מאוד</option>
              </select>
            ) : activityLabel(form.activity)}
          </Row>
          <Row label="ספורט">
            {editing ? (
              <select className="select" value={form.exercise} onChange={e => setForm({ ...form, exercise: e.target.value as ExerciseParticipation })}>
                <option value="yes">כן — תוכנית מלאה</option>
                <option value="limited">תנועה מוגבלת בלבד</option>
                <option value="no">בלי אימונים</option>
              </select>
            ) : exerciseLabel(form.exercise)}
          </Row>
          <Row label="מעקב מים">
            {editing ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, waterTracking: true })} className={`btn btn-sm ${form.waterTracking ? 'btn-primary' : 'btn-ghost'}`}>פעיל</button>
                <button type="button" onClick={() => setForm({ ...form, waterTracking: false })} className={`btn btn-sm ${!form.waterTracking ? 'btn-primary' : 'btn-ghost'}`}>כבוי</button>
              </div>
            ) : (form.waterTracking ? 'פעיל' : 'כבוי')}
          </Row>
        </Section>

        <Section icon={<Wind size={16} />} title="מיינדפולנס">
          <Row label="השתתפות">
            {editing ? (
              <select
                className="select"
                value={form.meditation}
                onChange={e => setForm({ ...form, meditation: e.target.value as MeditationParticipation })}
              >
                <option value="yes">כן — משלב באורח החיים</option>
                <option value="curious">מסקרן — רוצה להתנסות</option>
                <option value="no">לא רלוונטי בשבילי</option>
              </select>
            ) : meditationLabel(form.meditation)}
          </Row>
        </Section>

        <Section icon={<AlertTriangle size={16} />} title="רגישויות והעדפות">
          <Row label="אלרגיות">
            <div className="flex flex-wrap gap-1">
              {form.allergies.length === 0 ? '—' : form.allergies.map(a => <span key={a} className="pill pill-gold">{a}</span>)}
            </div>
          </Row>
          <Row label="לא אוהב/ת">
            <div className="flex flex-wrap gap-1">
              {form.dislikes.length === 0 ? '—' : form.dislikes.map(a => <span key={a} className="pill pill-sage">{a}</span>)}
            </div>
          </Row>
          {form.medicalNotes && <Row label="הערות רפואיות">{form.medicalNotes}</Row>}
        </Section>
      </div>

      {editing && (
        <div className="flex gap-3 mb-6">
          <button className="btn btn-primary" onClick={save}>
            <Save size={16} /> שמור שינויים
          </button>
          <button className="btn btn-ghost" onClick={() => { setForm(data.profile!); setEditing(false) }}>בטל</button>
        </div>
      )}

      {/* Danger zone */}
      <div className="card" style={{ border: '1px solid rgba(180, 52, 46, 0.3)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="font-semibold" style={{ color: 'var(--status-critical)' }}>איפוס כל הנתונים</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              מוחק את הפרופיל, יומן האכילה, המשקלים, ההרגלים והאימונים של החשבון הזה. פעולה בלתי-הפיכה.
            </div>
          </div>
          <button className="btn btn-ghost" style={{ color: 'var(--status-critical)', borderColor: 'rgba(180, 52, 46, 0.3)' }} onClick={reset}>
            <LogOut size={14} /> אפס הכול
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--gold-deep)' }}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>{label}</div>
      <div className="text-sm text-left" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  )
}

function goalLabel(g: Goal) {
  return g === 'lose_slow' ? 'אטי' : g === 'lose_moderate' ? 'מאוזן' : g === 'lose_fast' ? 'מהיר' : g === 'maintain' ? 'שימור' : 'רה-קומפוזיציה'
}
function dietStyleLabel(s: DietStyle) {
  return s === 'balanced' ? 'מאוזן' : s === 'mediterranean' ? 'ים-תיכוני' : s === 'high_protein' ? 'עתיר חלבון' : s === 'low_carb' ? 'דל פחמימות' : s === 'vegetarian' ? 'צמחוני' : 'טבעוני'
}
function fastingLabel(f: FastingWindow) {
  return f === 'none' ? 'ללא' : f
}
function activityLabel(a: ActivityLevel) {
  return a === 'sedentary' ? 'יושבנית' : a === 'light' ? 'קלה' : a === 'moderate' ? 'בינונית' : a === 'active' ? 'פעילה' : 'פעילה מאוד'
}
function exerciseLabel(e: ExerciseParticipation) {
  return e === 'yes' ? 'תוכנית מלאה' : e === 'limited' ? 'תנועה מוגבלת' : 'ללא אימונים'
}
function meditationLabel(m: MeditationParticipation) {
  return m === 'yes' ? 'משלב באורח החיים' : m === 'curious' ? 'רוצה להתנסות' : 'ללא'
}
