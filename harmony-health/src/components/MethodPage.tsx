import { Sparkles, Utensils, Activity, Moon, Brain, TrendingUp, BookOpen } from 'lucide-react'
import { PILLARS, METHOD_INTRO, type Pillar } from '../lib/methodology.ts'

const PILLAR_ICONS: Record<Pillar['key'], typeof Sparkles> = {
  nutrition: Utensils,
  movement: Activity,
  sleep: Moon,
  mind: Brain,
  measure: TrendingUp,
}

export function MethodPage() {
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
