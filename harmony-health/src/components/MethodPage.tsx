import { useMemo, useState } from 'react'
import { Sparkles, Utensils, Activity, Moon, Brain, TrendingUp, BookOpen, Compass, RefreshCw, ThumbsUp } from 'lucide-react'
import { PILLARS, METHOD_INTRO, type Pillar } from '../lib/methodology.ts'
import { METHODOLOGIES, methodologyByKey } from '../data/methodologies.ts'
import { needsWeeklyCheckIn, recentMethodologyFit } from '../lib/methodology-match.ts'
import type { useAppData } from '../hooks/useAppData.ts'
import type { MethodologyKey } from '../types.ts'
import { todayIso } from '../lib/storage.ts'

interface Props { data: ReturnType<typeof useAppData> }

const PILLAR_ICONS: Record<Pillar['key'], typeof Sparkles> = {
  nutrition: Utensils,
  movement: Activity,
  sleep: Moon,
  mind: Brain,
  measure: TrendingUp,
}

const FIT_EMOJI = ['😣', '😕', '🙂', '😃', '🤩']
const FIT_LABEL = ['קשה מאוד', 'לא ממש', 'סבבה', 'טוב', 'מצוין']

export function MethodPage({ data }: Props) {
  const profile = data.profile!
  const chosen = methodologyByKey(profile.methodology)

  return (
    <div>
      <div className="text-center mb-10">
        <div className="pillar-chip mb-4">
          <Sparkles size={14} /> השיטה שלנו
        </div>
        <h1 className="serif text-4xl md:text-5xl mb-4">
          <span className="gold-underline">{METHOD_INTRO.title}</span>
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          {METHOD_INTRO.subtitle}
        </p>
      </div>

      <div className="card-elevated p-8 md:p-10 mb-10">
        {METHOD_INTRO.paragraphs.map((p, i) => (
          <p key={i} className="mb-4 last:mb-0 text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {p}
          </p>
        ))}
      </div>

      {chosen && <PersonalMethodCard data={data} />}

      {/* Pillars */}
      <div className="space-y-6">
        {PILLARS.map(pillar => {
          const Icon = PILLAR_ICONS[pillar.key]
          return (
            <div key={pillar.key} className="card-elevated overflow-hidden">
              <div className="p-6 md:p-8" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)', color: 'var(--text-inverse)' }}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl" style={{ background: 'rgba(201, 169, 97, 0.2)', color: 'var(--gold)' }}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-70">עמוד {pillar.order}</div>
                    <h2 className="serif text-2xl" style={{ color: 'var(--text-inverse)' }}>{pillar.title}</h2>
                    <div className="text-sm opacity-90">{pillar.tagline}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>
                  {pillar.intro}
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
                      עקרונות
                    </div>
                    <ul className="space-y-3">
                      {pillar.principles.map((p, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed">
                          <span className="pill pill-gold flex-shrink-0" style={{ minWidth: 24, height: 24, padding: 0, justifyContent: 'center' }}>
                            {i + 1}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
                        בדיקה יומית
                      </div>
                      <ul className="space-y-2">
                        {pillar.dailyChecks.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--sage)' }}>✓</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
                        סקירה שבועית
                      </div>
                      <ul className="space-y-2">
                        {pillar.weeklyChecks.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-cool)' }}>◆</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-r-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--gold)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} style={{ color: 'var(--gold-deep)' }} />
                    <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold-deep)' }}>
                      מקורות
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pillar.drawsFrom.map(s => (
                      <span key={s} className="pill">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="card mt-10 text-center" style={{ background: 'var(--surface-2)' }}>
        <div className="text-sm leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          <strong>הבהרה חשובה:</strong> המידע באפליקציה מיועד לצרכי ליווי וחינוך בלבד. הוא אינו
          מהווה תחליף לייעוץ רפואי או תזונתי פרטני. אם יש לך מצב רפואי, את/ה בהריון, או שאת/ה
          נוטל/ת תרופות — התייעצ/י עם רופא/ה או דיאטן/ית קליני/ת לפני שינויים משמעותיים בתזונה
          ובפעילות.
        </div>
      </div>
    </div>
  )
}

// The user's chosen methodology block: shows what they picked, why, a weekly
// fit tracker, and — if 3 consecutive weeks are low — a swap suggestion.
function PersonalMethodCard({ data }: { data: ReturnType<typeof useAppData> }) {
  const profile = data.profile!
  const chosen = methodologyByKey(profile.methodology)!
  const [expanded, setExpanded] = useState(false)
  const [switching, setSwitching] = useState(false)
  const checkIns = data.methodologyCheckIns
  const needCheckIn = useMemo(
    () => needsWeeklyCheckIn(checkIns, profile.methodology),
    [checkIns, profile.methodology],
  )
  const fit = useMemo(
    () => recentMethodologyFit(checkIns, profile.methodology),
    [checkIns, profile.methodology],
  )
  const strugglingStreak = fit.lowStreak >= 3

  function submitFit(v: 1 | 2 | 3 | 4 | 5) {
    if (!profile.methodology) return
    data.addMethodologyCheckIn({
      date: todayIso(),
      methodology: profile.methodology,
      fit: v,
    })
  }

  function switchTo(k: MethodologyKey) {
    data.setProfile({ ...profile, methodology: k, methodologyReasons: undefined })
    setSwitching(false)
    setExpanded(false)
  }

  return (
    <div
      className="card-elevated mb-10 overflow-hidden"
      style={{ border: '1px solid var(--gold)' }}
    >
      <div
        className="p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, var(--gold-soft) 0%, var(--cream) 100%)',
        }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold-deep)' }}>
          <Compass size={14} />
          <span className="text-xs font-bold uppercase tracking-widest">השיטה שלך</span>
        </div>
        <h2 className="serif text-2xl md:text-3xl mb-1" style={{ color: 'var(--navy)' }}>{chosen.name}</h2>
        <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{chosen.tagline}</div>
        {profile.methodologyReasons && profile.methodologyReasons.length > 0 && (
          <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
            {profile.methodologyReasons.map((r, i) => (
              <li key={i}>◆ {r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-6 md:p-8">
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
          {chosen.approach}
        </p>

        {/* Weekly check-in */}
        <div className="p-4 rounded-2xl mb-5" style={{ background: 'var(--surface-2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp size={14} style={{ color: 'var(--gold-deep)' }} />
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold-deep)' }}>
              איך השיטה עובדת השבוע?
            </div>
          </div>
          <div className="flex gap-2 justify-around mb-2">
            {FIT_EMOJI.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => submitFit((i + 1) as 1 | 2 | 3 | 4 | 5)}
                className="text-3xl p-2 rounded-xl transition-all"
                style={{ background: 'transparent' }}
                title={FIT_LABEL[i]}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {needCheckIn
              ? 'עבר שבוע (או יותר) מאז הצ׳ק-אין האחרון — רגע לעצור ולהעריך.'
              : fit.count > 0
              ? `${fit.count} דיווחים אחרונים · ממוצע ${fit.avg} מתוך 5`
              : 'אין עדיין דיווחים — הראשון יגיע אחרי שבוע של ניסיון.'}
          </div>
        </div>

        {/* Struggling suggestion */}
        {strugglingStreak && (
          <div
            className="p-4 rounded-2xl mb-5 flex items-start gap-3"
            style={{
              background: 'rgba(180, 52, 46, 0.06)',
              border: '1px solid rgba(180, 52, 46, 0.25)',
            }}
          >
            <RefreshCw size={20} style={{ color: 'var(--status-critical)', flexShrink: 0, marginTop: 2 }} />
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
              <div className="font-semibold mb-1">3 שבועות רצוף שקשה איתה — שווה לנסות משהו אחר?</div>
              <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                כישלון בשיטה זו לא כישלון שלך — סימן שהיא לא מתאימה לחיים שלך עכשיו.
                יש לך 9 שיטות נוספות. תבחר מה שמרגיש נכון כרגע.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setSwitching(true)}>
                החלף שיטה
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'הסתר פרטים' : 'עוד על השיטה'}
          </button>
          {!strugglingStreak && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSwitching(true)}>
              <RefreshCw size={12} /> שנה שיטה
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t grid md:grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>
                מתאים במיוחד ל־
              </div>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {chosen.bestFor.map((b, i) => <li key={i}>✓ {b}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-deep)' }}>
                חסרונות
              </div>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {chosen.drawbacks.map((b, i) => <li key={i}>◦ {b}</li>)}
              </ul>
            </div>
            <div className="md:col-span-2 text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
              <BookOpen size={12} style={{ display: 'inline', marginLeft: 4 }} />
              {chosen.sourcesShort}
            </div>
          </div>
        )}
      </div>

      {switching && (
        <div className="p-6 md:p-8 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-deep)' }}>
            בחר שיטה חדשה
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {METHODOLOGIES.filter(m => m.key !== profile.methodology).map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => switchTo(m.key)}
                className="p-3 rounded-xl text-right border transition-all"
                style={{
                  background: 'var(--surface-1)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--navy)' }}>{m.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.tagline}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => setSwitching(false)}>בטל</button>
        </div>
      )}
    </div>
  )
}
