import { useState } from 'react'
import { LogIn, UserPlus, Sparkles, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react'
import type { Account } from '../types.ts'
import { createAccount, loginAccount } from '../lib/accounts.ts'

interface Props {
  onAuthenticated: (account: Account) => void
}

type Mode = 'login' | 'signup'

export function Auth({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (!name.trim()) return setError('נא להזין שם')
      if (!email.trim()) return setError('נא להזין כתובת מייל')
      if (password.length < 6) return setError('סיסמה חייבת להכיל לפחות 6 תווים')
      if (password !== confirm) return setError('הסיסמאות לא תואמות')
    } else {
      if (!email.trim() || !password) return setError('נא להזין מייל וסיסמה')
    }

    setBusy(true)
    try {
      const account = mode === 'signup'
        ? await createAccount(name, email, password)
        : await loginAccount(email, password)
      onAuthenticated(account)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ background: 'var(--surface-1)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--gold-deep)' }}>
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ letterSpacing: '0.2em' }}>Harmony</span>
          </div>
          <h1 className="serif text-4xl mb-2" style={{ color: 'var(--navy)' }}>הרמוניה</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            שיטת 5 העמודים לירידה במשקל ואורח חיים בריא
          </p>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null) }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: mode === 'signup' ? 'var(--navy)' : 'transparent',
                color: mode === 'signup' ? 'white' : 'var(--text-secondary)',
              }}
            >
              <UserPlus size={16} /> חשבון חדש
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null) }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: mode === 'login' ? 'var(--navy)' : 'transparent',
                color: mode === 'login' ? 'white' : 'var(--text-secondary)',
              }}
            >
              <LogIn size={16} /> התחברות
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label flex items-center gap-2">
                  <UserIcon size={14} /> שם מלא
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="שרה כהן"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="label flex items-center gap-2">
                <Mail size={14} /> כתובת מייל
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                dir="ltr"
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Lock size={14} /> סיסמה
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'לפחות 6 תווים' : ''}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  className="absolute top-1/2 -translate-y-1/2 left-3 p-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label flex items-center gap-2">
                  <Lock size={14} /> אישור סיסמה
                </label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    className="absolute top-1/2 -translate-y-1/2 left-3 p-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-sm"
                style={{ background: 'rgba(200,60,60,0.08)', color: 'var(--status-critical)' }}
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? 'רגע…' : (mode === 'signup' ? 'צור חשבון והתחל' : 'התחבר')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            הנתונים נשמרים בדפדפן שלך בלבד. אפשר לגשת מכל מכשיר בו אתה מחובר לחשבון.
          </div>
        </div>

        <div className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          יצירת חשבון פירושה שאתה מסכים לשמור את נתוני המסע שלך במכשיר זה
        </div>
      </div>
    </div>
  )
}
