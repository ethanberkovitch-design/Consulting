import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Wind,
  Timer,
  BookHeart,
  Music4,
  Play,
  Pause,
  Square,
  Bell,
  Sparkles,
  Waves,
  CloudRain,
  Sun,
  Save,
  Plus,
  Check,
} from 'lucide-react'
import type { useAppData } from '../hooks/useAppData.ts'
import { playBell, playAmbient, type SoundHandle, type AmbientKind } from '../lib/audio.ts'
import { todayIso } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

type Tab = 'breathe' | 'meditate' | 'sounds' | 'guided' | 'gratitude'

export function Mindfulness({ data }: Props) {
  const [tab, setTab] = useState<Tab>('breathe')

  const weekSessions = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return data.mindful.filter(s => new Date(s.date) >= start)
  }, [data.mindful])
  const weekMinutes = weekSessions.reduce((s, x) => s + x.minutes, 0)

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold-deep)' }}>
          עמוד 4 · אורח חיים בריא
        </div>
        <h1 className="text-3xl md:text-4xl">מיינדפולנס ורגיעה</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          המקום שלך להתעצר, לנשום ולזוז לאט. ירידה במשקל שנשארת נשענת על ראש רגוע — לא על משמעת ברזל.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatTile label="שבוע נוכחי" value={`${weekMinutes} דק'`} icon={<Timer size={16} />} />
        <StatTile label="סשנים השבוע" value={String(weekSessions.length)} icon={<Sparkles size={16} />} />
        <StatTile label={'סה"כ סשנים'} value={String(data.mindful.length)} icon={<BookHeart size={16} />} />
        <StatTile label="רצף ימים" value={`${computeStreak(data.mindful)} ימים`} icon={<Sun size={16} />} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <TabBtn active={tab === 'breathe'} onClick={() => setTab('breathe')} icon={<Wind size={14} />} label="נשימה" />
        <TabBtn active={tab === 'meditate'} onClick={() => setTab('meditate')} icon={<Timer size={14} />} label="מדיטציה בזמן" />
        <TabBtn active={tab === 'sounds'} onClick={() => setTab('sounds')} icon={<Music4 size={14} />} label="צלילים מרגיעים" />
        <TabBtn active={tab === 'guided'} onClick={() => setTab('guided')} icon={<BookHeart size={14} />} label="מדיטציות מודרכות" />
        <TabBtn active={tab === 'gratitude'} onClick={() => setTab('gratitude')} icon={<Sparkles size={14} />} label="יומן הכרת תודה" />
      </div>

      {tab === 'breathe' && <Breathing data={data} />}
      {tab === 'meditate' && <MeditationTimer data={data} />}
      {tab === 'sounds' && <AmbientSounds />}
      {tab === 'guided' && <GuidedMeditations data={data} />}
      {tab === 'gratitude' && <Gratitude data={data} />}
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold-deep)' }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <div className="serif text-2xl font-bold" style={{ color: 'var(--navy)' }}>{value}</div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-3 rounded-2xl border transition-all whitespace-nowrap flex items-center gap-2"
      style={{
        background: active ? 'var(--navy)' : 'var(--surface-1)',
        color: active ? 'var(--text-inverse)' : 'var(--navy)',
        borderColor: active ? 'var(--navy)' : 'var(--border)',
      }}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

// ==================== Breathing ====================
type BreathingPattern = { key: string; label: string; desc: string; inhale: number; hold: number; exhale: number; hold2: number }

const PATTERNS: BreathingPattern[] = [
  { key: 'box', label: 'קופסא (4·4·4·4)', desc: 'ריכוז ואיזון — נעל התאוששות', inhale: 4, hold: 4, exhale: 4, hold2: 4 },
  { key: '478', label: '4·7·8', desc: 'רגיעה עמוקה, טוב לפני שינה', inhale: 4, hold: 7, exhale: 8, hold2: 0 },
  { key: 'coherent', label: 'לב לקוהרנטי (5·5)', desc: 'איזון מערכת עצבים', inhale: 5, hold: 0, exhale: 5, hold2: 0 },
  { key: 'deep', label: 'נשימה עמוקה (6·2·6)', desc: 'הפחתת לחץ', inhale: 6, hold: 2, exhale: 6, hold2: 0 },
]

function Breathing({ data }: { data: ReturnType<typeof useAppData> }) {
  const [patternKey, setPatternKey] = useState('box')
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale')
  const [elapsed, setElapsed] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(3)
  const pattern = PATTERNS.find(p => p.key === patternKey)!
  const startRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now()
    const cycleSeconds = pattern.inhale + pattern.hold + pattern.exhale + pattern.hold2
    const stopAtMs = totalMinutes * 60 * 1000

    function step() {
      const now = performance.now()
      const dt = (now - startRef.current) / 1000
      setElapsed(dt)
      if (dt * 1000 >= stopAtMs) {
        finish()
        return
      }
      const withinCycle = dt % cycleSeconds
      if (withinCycle < pattern.inhale) setPhase('inhale')
      else if (withinCycle < pattern.inhale + pattern.hold) setPhase('hold')
      else if (withinCycle < pattern.inhale + pattern.hold + pattern.exhale) setPhase('exhale')
      else setPhase('hold2')
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    playBell(660)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, patternKey])

  function finish() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    playBell(528)
    const minutes = Math.max(1, Math.round(elapsed / 60))
    data.addMindfulness({ date: todayIso(), type: 'breathing', minutes })
    setRunning(false)
    setElapsed(0)
    setPhase('inhale')
  }

  const scale = phase === 'inhale' ? 1
    : phase === 'hold' ? 1
    : phase === 'exhale' ? 0.5
    : 0.5
  const label = phase === 'inhale' ? 'שאיפה'
    : phase === 'hold' ? 'החזק'
    : phase === 'exhale' ? 'נשיפה'
    : 'החזק'
  const phaseSeconds = phase === 'inhale' ? pattern.inhale
    : phase === 'hold' ? pattern.hold
    : phase === 'exhale' ? pattern.exhale
    : pattern.hold2

  return (
    <div className="card">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
            תבנית נשימה
          </div>
          <div className="space-y-2 mb-6">
            {PATTERNS.map(p => (
              <button
                key={p.key}
                type="button"
                disabled={running}
                onClick={() => setPatternKey(p.key)}
                className="w-full p-3 rounded-xl border text-right transition-all"
                style={{
                  background: patternKey === p.key ? 'var(--navy)' : 'var(--surface-1)',
                  color: patternKey === p.key ? 'var(--text-inverse)' : 'var(--navy)',
                  borderColor: patternKey === p.key ? 'var(--navy)' : 'var(--border)',
                  opacity: running ? 0.5 : 1,
                }}
              >
                <div className="font-semibold text-sm">{p.label}</div>
                <div className="text-xs opacity-80">{p.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="label">משך (דקות)</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 15].map(m => (
                <button
                  key={m}
                  type="button"
                  disabled={running}
                  onClick={() => setTotalMinutes(m)}
                  className={`btn btn-sm ${totalMinutes === m ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[360px]">
          <div style={{ position: 'relative', width: 240, height: 240 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--gold-soft) 0%, var(--sage) 60%, var(--navy) 100%)',
                transform: `scale(${scale})`,
                transition: `transform ${phaseSeconds}s ease-in-out`,
                boxShadow: '0 12px 40px rgba(11, 31, 58, 0.25)',
                opacity: running ? 1 : 0.7,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--text-inverse)',
              }}
            >
              <div className="serif text-4xl font-bold">{running ? label : 'מוכן?'}</div>
              {running && <div className="text-sm opacity-80 mt-1">{Math.max(0, totalMinutes * 60 - Math.floor(elapsed))} שנ'</div>}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {!running && (
              <button className="btn btn-gold" onClick={() => setRunning(true)}>
                <Play size={16} /> התחל
              </button>
            )}
            {running && (
              <button className="btn btn-ghost" onClick={finish}>
                <Square size={16} /> סיים ושמור
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Meditation Timer ====================
function MeditationTimer({ data }: { data: ReturnType<typeof useAppData> }) {
  const [minutes, setMinutes] = useState(10)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [intervalBell, setIntervalBell] = useState<number>(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!running || paused) return
    const startAt = performance.now() + remaining * 1000
    let lastBell = 0
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((startAt - performance.now()) / 1000))
      setRemaining(left)
      if (intervalBell > 0) {
        const elapsedSec = minutes * 60 - left
        const bellSec = Math.floor(elapsedSec / (intervalBell * 60))
        if (bellSec > lastBell && left > 0) {
          lastBell = bellSec
          playBell(528)
        }
      }
      if (left <= 0) {
        finish()
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused])

  function start() {
    setRemaining(minutes * 60)
    setRunning(true)
    setPaused(false)
    playBell(660)
  }
  function finish() {
    playBell(528)
    if (remaining <= 0 || minutes > 0) {
      const done = Math.max(1, minutes - Math.round(remaining / 60))
      data.addMindfulness({ date: todayIso(), type: 'meditation', minutes: done })
    }
    setRunning(false)
    setPaused(false)
    setRemaining(0)
  }

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60

  return (
    <div className="card">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
            משך הסשן
          </div>
          <div className="flex gap-2 flex-wrap mb-6">
            {[5, 10, 15, 20, 30, 45].map(m => (
              <button
                key={m}
                type="button"
                disabled={running}
                onClick={() => setMinutes(m)}
                className={`btn btn-sm ${minutes === m ? 'btn-primary' : 'btn-ghost'}`}
              >
                {m} דק'
              </button>
            ))}
          </div>

          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
            פעמון בין-ביניים
          </div>
          <div className="flex gap-2 flex-wrap">
            {[0, 2, 5].map(m => (
              <button
                key={m}
                type="button"
                disabled={running}
                onClick={() => setIntervalBell(m)}
                className={`btn btn-sm ${intervalBell === m ? 'btn-primary' : 'btn-ghost'}`}
              >
                {m === 0 ? 'ללא' : `כל ${m} דק'`}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
            <strong>טיפ:</strong> ישיבה נעימה, גב זקוף בלי מתח. עיניים סגורות או מבט רך על נקודה. חוזרים לנשימה כל פעם שהתודעה נודדת.
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <div className="serif" style={{ fontSize: 72, color: 'var(--navy)', fontWeight: 700, lineHeight: 1 }}>
              {running ? `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${minutes}:00`}
            </div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {running ? (paused ? 'מושהה' : 'סשן פעיל') : 'מוכן להתחלה'}
            </div>
          </div>

          <div className="flex gap-2">
            {!running && (
              <button className="btn btn-gold" onClick={start}>
                <Play size={16} /> התחל מדיטציה
              </button>
            )}
            {running && (
              <>
                <button className="btn btn-ghost" onClick={() => setPaused(p => !p)}>
                  {paused ? <><Play size={16} /> המשך</> : <><Pause size={16} /> השהה</>}
                </button>
                <button className="btn btn-primary" onClick={finish}>
                  <Square size={16} /> סיים
                </button>
              </>
            )}
          </div>

          <button className="btn btn-ghost btn-sm mt-4" onClick={() => playBell(528)}>
            <Bell size={14} /> שמע את הפעמון
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== Ambient Sounds ====================
function AmbientSounds() {
  const [playing, setPlaying] = useState<AmbientKind | null>(null)
  const handleRef = useRef<SoundHandle | null>(null)

  useEffect(() => {
    return () => { handleRef.current?.stop() }
  }, [])

  function toggle(kind: AmbientKind) {
    if (playing === kind) {
      handleRef.current?.fadeOut(1.5)
      handleRef.current = null
      setPlaying(null)
      return
    }
    handleRef.current?.fadeOut(1)
    setTimeout(() => {
      handleRef.current = playAmbient(kind)
      setPlaying(kind)
    }, playing ? 300 : 0)
  }

  const SOUNDS: { kind: AmbientKind; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { kind: 'rain', label: 'גשם', desc: 'צליל גשם רך על החלון', icon: <CloudRain size={28} />, color: 'var(--accent-cool)' },
    { kind: 'ocean', label: 'גלים', desc: 'גלים איטיים על החוף', icon: <Waves size={28} />, color: 'var(--sage-deep)' },
    { kind: 'pad', label: 'פאד רוגע', desc: 'צליל אלקטרוני שקט ומתפתח', icon: <Music4 size={28} />, color: 'var(--gold-deep)' },
  ]

  return (
    <div>
      <div className="card mb-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          צלילים סינתטיים שנוצרים בדפדפן בזמן אמת (Web Audio) — אין הורדות, אין רשת. מושלם ברקע בזמן עבודה, קריאה או מדיטציה.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {SOUNDS.map(s => {
          const active = playing === s.kind
          return (
            <button
              key={s.kind}
              type="button"
              onClick={() => toggle(s.kind)}
              className="card text-right transition-all hover:shadow-md"
              style={{
                background: active ? 'linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)' : 'var(--surface-1)',
                color: active ? 'var(--text-inverse)' : 'var(--navy)',
                borderColor: active ? 'var(--navy)' : 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div style={{ color: active ? 'var(--gold)' : s.color }}>{s.icon}</div>
                {active ? <Pause size={18} /> : <Play size={18} />}
              </div>
              <div className="font-semibold text-lg">{s.label}</div>
              <div className="text-xs mt-1" style={{ opacity: 0.8 }}>{s.desc}</div>
              {active && <div className="text-xs mt-3 pill pill-gold" style={{ background: 'rgba(201, 169, 97, 0.25)' }}>מנגן</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ==================== Guided Meditations ====================
const GUIDES = [
  {
    id: 'body-scan',
    title: 'סריקת גוף',
    duration: 8,
    intro: 'תרגול קלאסי לחיבור עם הגוף ולזיהוי מתחים נסתרים.',
    steps: [
      { time: 0, text: 'שכב או שב בנוחיות. עצום עיניים אם נעים. הרגישי את הכתפיים משתחררות.' },
      { time: 30, text: 'שים לב לנשימה — בלי לשנות אותה. פשוט מבחין באוויר שנכנס ויוצא.' },
      { time: 60, text: 'הבא את המודעות לכפות הרגליים. הרגישי כל אצבע, את הרצפה מתחתן.' },
      { time: 120, text: 'עלה לשוקיים, לברכיים, לירכיים. אם יש מתח — פשוט מבחין בו, לא צריך לשנות.' },
      { time: 180, text: 'הבטן. עולה ויורדת עם הנשימה. הגב התחתון. הכתפיים.' },
      { time: 240, text: 'הידיים — מהאצבעות עד הכתפיים. הצוואר. הלסת.' },
      { time: 300, text: 'הפנים — הרכבנים סביב העיניים. המצח. הקדקוד.' },
      { time: 360, text: 'רגע לחוש את הגוף כולו כישות אחת. נושם. חי.' },
      { time: 420, text: 'התחל להביא תנועה קטנה. פקח עיניים כשמוכן.' },
    ],
  },
  {
    id: 'craving',
    title: 'עצירה לפני האכילה הרגשית',
    duration: 4,
    intro: 'רגע לפני שאתה נגרר לחטיף — 4 דקות של בחירה מודעת.',
    steps: [
      { time: 0, text: 'עצור. ידיים ליד הגוף. שאף עמוק דרך האף למשך 4 שניות.' },
      { time: 20, text: 'החזק 4 שניות. שחרר לאט דרך הפה למשך 6 שניות.' },
      { time: 40, text: 'שאל את עצמך: "אני רעב או משהו אחר?" ללא שיפוט.' },
      { time: 90, text: 'אם רעב — אכול. אם לא — מה באמת אני צריך? מים? הפוגה? קשר?' },
      { time: 150, text: 'הכה נבחר: 5 דקות של אחר. 10 דקות של אויר. שתי כוסות מים.' },
      { time: 200, text: 'אם עדיין תרצה לאכול אחרי זה — זו בחירה מודעת, לא דחף. תפדל.' },
      { time: 240, text: 'ניצחת בקטן. זה מצטבר.' },
    ],
  },
  {
    id: 'self-compassion',
    title: 'חמלה עצמית לרגעי כישלון',
    duration: 5,
    intro: 'לימים שבהם המשקל עלה או הרגלת גדולה מהצפוי.',
    steps: [
      { time: 0, text: 'הנח יד אחת על הלב. חוש את החום.' },
      { time: 30, text: 'הכר במה שקרה. "היום היה קשה." בלי לרכך, בלי להאשים.' },
      { time: 90, text: 'זכור: זה חלק מלהיות אדם. כל אחד עובר את זה.' },
      { time: 150, text: 'דבר אל עצמך כמו שהיית מדבר אל חבר טוב. במה הוא צריך עכשיו?' },
      { time: 210, text: 'שלח לעצמך משפט חם: "אני שווה טיפול טוב. גם היום."' },
      { time: 270, text: 'הבא לתשומת לב ריווח אחד קטן שאעשה עכשיו לעצמי.' },
      { time: 300, text: 'המסע ארוך. יום אחד לא קובע כלום.' },
    ],
  },
]

function GuidedMeditations({ data }: { data: ReturnType<typeof useAppData> }) {
  const [active, setActive] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const guide = GUIDES.find(g => g.id === active)

  useEffect(() => {
    if (!playing || !guide) return
    const start = performance.now() - elapsed * 1000
    const id = setInterval(() => {
      const t = (performance.now() - start) / 1000
      setElapsed(t)
      if (t >= guide.duration * 60) {
        finish()
      }
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  function start(id: string) {
    setActive(id)
    setElapsed(0)
    setPlaying(true)
    playBell(660)
  }
  function finish() {
    if (guide) {
      const minutes = Math.max(1, Math.round(elapsed / 60))
      data.addMindfulness({ date: todayIso(), type: guide.id === 'body-scan' ? 'body_scan' : 'meditation', minutes })
    }
    setPlaying(false)
    setActive(null)
    setElapsed(0)
    playBell(528)
  }

  if (active && guide) {
    const currentStep = [...guide.steps].reverse().find(s => elapsed >= s.time) ?? guide.steps[0]
    const remaining = Math.max(0, guide.duration * 60 - elapsed)
    return (
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>
            {guide.title}
          </div>
          <div className="serif text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            {Math.floor(remaining / 60)}:{String(Math.floor(remaining % 60)).padStart(2, '0')}
          </div>
        </div>

        <div
          className="p-8 rounded-2xl text-center min-h-[180px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--sage) 0%, var(--navy-3) 100%)',
            color: 'var(--text-inverse)',
          }}
        >
          <div className="serif text-xl md:text-2xl leading-relaxed">
            {currentStep.text}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          <button className="btn btn-ghost" onClick={() => setPlaying(p => !p)}>
            {playing ? <><Pause size={16} /> השהה</> : <><Play size={16} /> המשך</>}
          </button>
          <button className="btn btn-primary" onClick={finish}>
            <Square size={16} /> סיים
          </button>
        </div>

        <div className="mt-4">
          <div className="progress-track">
            <div
              className="progress-fill sage"
              style={{ width: `${Math.min(100, (elapsed / (guide.duration * 60)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {GUIDES.map(g => (
        <div key={g.id} className="card flex flex-col">
          <div className="pillar-chip mb-3 self-start"><Timer size={12} /> {g.duration} דק'</div>
          <h3 className="text-xl mb-2">{g.title}</h3>
          <p className="text-sm flex-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
            {g.intro}
          </p>
          <button className="btn btn-primary" onClick={() => start(g.id)}>
            <Play size={16} /> התחל
          </button>
        </div>
      ))}
    </div>
  )
}

// ==================== Gratitude ====================
function Gratitude({ data }: { data: ReturnType<typeof useAppData> }) {
  const today = todayIso()
  const existing = data.gratitude.find(g => g.date === today)
  const [items, setItems] = useState<string[]>(existing?.items ?? ['', '', ''])

  function updateItem(i: number, value: string) {
    setItems(prev => prev.map((v, idx) => (idx === i ? value : v)))
  }
  function addRow() {
    setItems(prev => [...prev, ''])
  }
  function save() {
    const filled = items.map(i => i.trim()).filter(Boolean)
    if (filled.length === 0) return
    data.upsertGratitude({ date: today, items: filled })
    data.addMindfulness({ date: today, type: 'gratitude', minutes: 3 })
  }

  const past = [...data.gratitude]
    .filter(g => g.date !== today && g.items.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card md:col-span-2">
        <div className="section-title">
          <span className="kicker">היום · {new Date().toLocaleDateString('he-IL')}</span>
          <h2>שלושה דברים שאני אסיר/ת תודה עליהם</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          מחקרים מראים ש-3 דקות של כתיבת הכרת תודה ביום מפחיתות אכילה רגשית, משפרות שינה ומורידות רמות קורטיזול. פשוט, ועובד.
        </p>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <div
                className="serif text-xl font-bold flex-shrink-0"
                style={{ color: 'var(--gold-deep)', width: 32, textAlign: 'center' }}
              >
                {i + 1}
              </div>
              <input
                className="input"
                placeholder={`דבר טוב שקרה, מישהו שהעריכני, משהו קטן שנתן חיוך...`}
                value={item}
                onChange={e => updateItem(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn btn-ghost btn-sm" onClick={addRow}>
            <Plus size={14} /> עוד שורה
          </button>
          <button className="btn btn-primary" onClick={save}>
            <Save size={16} /> שמור
          </button>
          {existing && <span className="pill pill-sage self-center"><Check size={12} /> נשמר היום</span>}
        </div>
      </div>

      <div className="card">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
          ימים קודמים
        </div>
        {past.length === 0 && (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ההיסטוריה תופיע כאן אחרי כמה ימים של כתיבה.
          </div>
        )}
        <div className="space-y-3">
          {past.map(g => (
            <div key={g.id} className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {new Date(g.date).toLocaleDateString('he-IL')}
              </div>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {g.items.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: 'var(--gold)' }}>◆</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== Helpers ====================
function computeStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0
  const dates = new Set(sessions.map(s => s.date))
  let streak = 0
  const d = new Date()
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dates.has(key)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      // Allow today to be empty (streak counts from yesterday if today missed)
      if (streak === 0) {
        d.setDate(d.getDate() - 1)
        const key2 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!dates.has(key2)) break
      } else break
    }
  }
  return streak
}
