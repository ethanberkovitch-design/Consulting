import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthPanelProps {
  user: User | null;
  onSignedIn: () => void;
  onSave: () => void;
  saving: boolean;
  savedAt: Date | null;
}

export function AuthPanel({ user, onSignedIn, onSave, saving, savedAt }: AuthPanelProps) {
  const { signUp, signIn, signOut } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'signUp') {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setInfo('נרשמת בהצלחה! בדקו את תיבת המייל לאישור החשבון, ואז התחברו.');
        setMode('signIn');
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
      >
        <span className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4" style={{ color: 'var(--brand-1)' }} aria-hidden="true" />
          מחובר/ת כ-<strong>{user.email}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'var(--brand-gradient)' }}
          >
            {saving ? 'שומר...' : 'שמור את הנתונים שלי'}
          </button>
          {savedAt && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--status-good)' }}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> נשמר
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full border px-4 py-2 text-sm font-bold"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            התנתק
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Lock className="h-4 w-4" style={{ color: 'var(--brand-1)' }} aria-hidden="true" />{' '}
          {mode === 'signIn' ? 'התחברות' : 'הרשמה'}
        </span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
            setInfo(null);
          }}
          className="text-xs font-bold underline"
          style={{ color: 'var(--brand-1)' }}
        >
          {mode === 'signIn' ? 'משתמש/ת חדש/ה? הרשמו' : 'כבר רשומים? התחברו'}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        התחברות מאפשרת לשמור את הנתונים שלכם בין ביקורים, בחשבון פרטי ומאובטח.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>אימייל</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-2 px-3 py-2 text-sm outline-none focus:border-[var(--brand-1)]"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
          />
        </label>
        <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>סיסמה</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-2 px-3 py-2 text-sm outline-none focus:border-[var(--brand-1)]"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--brand-gradient)' }}
        >
          {submitting ? '...' : mode === 'signIn' ? 'התחבר/י' : 'הירשם/י'}
        </button>
      </form>
      {error && <p className="text-xs font-medium" style={{ color: 'var(--status-critical)' }}>{error}</p>}
      {info && <p className="text-xs font-medium" style={{ color: 'var(--status-good)' }}>{info}</p>}
    </div>
  );
}
