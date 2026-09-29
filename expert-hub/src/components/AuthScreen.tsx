import { useState } from 'react';
import { FileSearch, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { EXPERTS, CATEGORY_COLOR } from '../experts/registry';

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

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
      <section className="flex flex-col justify-center gap-6">
        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{t('tagline')}</h1>
        <ul className="flex flex-col gap-3">
          {points.map(({ icon: Icon, ...text }) => (
            <li key={text.en} className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
              {text[lang]}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {EXPERTS.map((expert) => (
            <span
              key={expert.id}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
            >
              <expert.icon className="h-4 w-4" style={{ color: CATEGORY_COLOR[expert.category] }} aria-hidden="true" />
              {expert.name[lang]}
            </span>
          ))}
        </div>
      </section>

      <section
        className="rounded-xl border p-6"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="mb-5 text-xl font-bold">{mode === 'signIn' ? t('signIn') : t('signUp')}</h2>
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
              className="rounded-md border px-3 py-2.5 text-base"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
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
              className="rounded-md border px-3 py-2.5 text-base"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md px-4 py-2.5 font-bold disabled:opacity-60"
            style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
          >
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
          className="mt-4 text-sm font-medium underline"
          style={{ color: 'var(--brand)' }}
        >
          {mode === 'signIn' ? t('noAccount') : t('haveAccount')}
        </button>
      </section>
    </main>
  );
}
