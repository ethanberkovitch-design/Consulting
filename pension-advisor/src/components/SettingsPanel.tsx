import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Laptop, Moon, RotateCcw, Settings, Sun, Trash2, X } from 'lucide-react';
import { useAppearance, type AccentChoice, type ThemeChoice } from '../hooks/useAppearance';

interface SettingsPanelProps {
  user: User | null;
  onResetData: () => void;
  onClearSaved: () => Promise<void>;
}

const THEME_OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'בהיר', Icon: Sun },
  { value: 'dark', label: 'כהה', Icon: Moon },
  { value: 'system', label: 'מערכת', Icon: Laptop },
];

const ACCENT_OPTIONS: { value: AccentChoice; label: string; gradient: string }[] = [
  { value: 'aurora', label: 'אורורה', gradient: 'linear-gradient(120deg, #7c3aed, #ec4899, #fb923c)' },
  { value: 'ocean', label: 'אוקיינוס', gradient: 'linear-gradient(120deg, #2563eb, #06b6d4, #22d3ee)' },
  { value: 'forest', label: 'יער', gradient: 'linear-gradient(120deg, #059669, #65a30d, #facc15)' },
  { value: 'sunset', label: 'שקיעה', gradient: 'linear-gradient(120deg, #dc2626, #ea580c, #f59e0b)' },
];

export function SettingsPanel({ user, onResetData, onClearSaved }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { theme, setTheme, accent, setAccent } = useAppearance();

  const handleClearSaved = async () => {
    setClearing(true);
    await onClearSaved();
    setClearing(false);
    setConfirmClear(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="הגדרות"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-md flex-col gap-5 rounded-3xl border p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Settings className="h-5 w-5" style={{ color: 'var(--brand-1)' }} aria-hidden="true" /> הגדרות
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="סגור">
                <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                מראה
              </span>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-bold"
                    style={{
                      borderColor: theme === value ? 'var(--brand-1)' : 'var(--border)',
                      background: theme === value ? 'color-mix(in srgb, var(--brand-1) 10%, var(--surface-1))' : 'var(--surface-2)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                צבע
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_OPTIONS.map(({ value, label, gradient }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAccent(value)}
                    className="flex flex-col items-center gap-1.5"
                    aria-label={label}
                  >
                    <span
                      className="h-9 w-9 rounded-full"
                      style={{
                        background: gradient,
                        outline: accent === value ? '2px solid var(--text-primary)' : 'none',
                        outlineOffset: 2,
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                נתונים
              </span>
              <button
                type="button"
                onClick={onResetData}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-bold"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                איפוס הטופס לנתוני ברירת מחדל
              </button>

              {user && (
                <div className="flex flex-col gap-2">
                  {!confirmClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-bold"
                      style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      מחיקת הנתונים השמורים בחשבון
                    </button>
                  ) : (
                    <div
                      className="flex flex-col gap-2 rounded-2xl p-3 text-sm"
                      style={{ background: 'color-mix(in srgb, var(--status-critical) 10%, var(--surface-1))' }}
                    >
                      <span>בטוח/ה? הנתונים השמורים בענן יימחקו לצמיתות (זה לא משפיע על הטופס כרגע במסך).</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleClearSaved}
                          disabled={clearing}
                          className="rounded-full px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                          style={{ background: 'var(--status-critical)' }}
                        >
                          {clearing ? 'מוחק...' : 'כן, מחק'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="rounded-full border px-3 py-1.5 text-xs font-bold"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
