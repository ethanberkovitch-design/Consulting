import { useState } from 'react';
import { FileSearch, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { EXPERTS, CATEGORY_COLOR } from '../experts/registry';
import { BlueprintDrawing } from './BlueprintDrawing';

export function AuthScreen() {
  const { t, lang } = useI18n();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const { error: authError } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
      if (authError) throw authError;
      if (mode === 'signUp') {
        setInfo(t('checkEmail'));
        setMode('signIn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const points = [
    { icon: FileSearch, he: 'העלו מסמכים — PDF, Word, Excel ותמונות', en: 'Upload documents — PDF, Word, Excel and images' },
    { icon: ShieldCheck, he: 'כל טענה מגובה במקור: עמוד, סעיף או קישור', en: 'Every claim traced to a source: page, clause or link' },
    { icon: FileText, he: 'דוח מקצועי מסודר, מוכן להעברה', en: 'A structured professional report, ready to share' },
  ];

  const inputStyle = { borderColor: 'var(--border-strong)', background: 'rgba(6,16,29,0.6)', color: 'var(--text-primary)' };

  return (
    <main className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.25fr_1fr] lg:py-16">
      <section className="flex flex-col gap-6">
        <p className="tech-label fade-up flex items-center gap-2" style={{ color: 'var(--line)' }}>
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--line)' }} />
          Expert Hub · {lang === 'he' ? 'הנדסה · פיננסים · ניהול' : 'Engineering · Finance · Management'}
        </p>
        <h1 className="fade-up text-3xl font-extrabold leading-tight md:text-5xl" style={{ ['--delay' as string]: '0.1s' }}>
          {t('tagline')}
        </h1>
        <ul className="flex flex-col gap-3">
          {points.map(({ icon: Icon, ...text }, i) => (
            <li
              key={text.en}
              className="fade-up flex items-center gap-3"
              style={{ color: 'var(--text-secondary)', ['--delay' as string]: `${0.25 + i * 0.1}s` }}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border" style={{ borderColor: 'var(--border)' }}>
                <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
              </span>
              {text[lang]}
            </li>
          ))}
        </ul>
        <div className="bp-panel bp-corners hidden p-4 sm:block">
          <BlueprintDrawing className="w-full" />
          <div className="dim-ticks mt-2">
            <div className="dim-line">
              <span>
                {EXPERTS.length.toString().padStart(2, '0')} {lang === 'he' ? 'מומחים' : 'EXPERTS'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXPERTS.map((expert) => (
              <span
                key={expert.id}
                className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm"
                style={{ borderColor: 'var(--border)', background: 'rgba(6,16,29,0.5)' }}
              >
                <expert.icon className="h-4 w-4" style={{ color: CATEGORY_COLOR[expert.category] }} aria-hidden="true" />
                {expert.name[lang]}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bp-panel bp-corners fade-up p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)', ['--delay' as string]: '0.2s' }}>
        <p className="tech-label mb-2">{mode === 'signIn' ? 'AUTH / SIGN-IN' : 'AUTH / NEW ACCOUNT'}</p>
        <h2 className="mb-6 text-2xl font-bold">{mode === 'signIn' ? t('signIn') : t('signUp')}</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('email')}
            <input
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mono rounded-md border px-3 py-2.5 text-base outline-none transition-colors focus:border-[var(--brand)]"
              style={inputStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('password')}
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mono rounded-md border px-3 py-2.5 text-base outline-none transition-colors focus:border-[var(--brand)]"
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={submitting} className="btn-accent mt-1 rounded-md px-4 py-3 font-bold disabled:opacity-60">
            {submitting ? t('loading') : mode === 'signIn' ? t('signIn') : t('signUp')}
          </button>
          {error && (
            <p role="alert" className="text-sm" style={{ color: 'var(--status-critical)' }}>
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-sm" style={{ color: 'var(--status-good)' }}>
              {info}
            </p>
          )}
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
            setInfo(null);
          }}
          className="mt-5 text-sm font-medium underline underline-offset-4"
          style={{ color: 'var(--brand)' }}
        >
          {mode === 'signIn' ? t('noAccount') : t('haveAccount')}
        </button>
      </section>
    </main>
  );
}
