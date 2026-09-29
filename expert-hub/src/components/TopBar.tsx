import { Languages, LogOut } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface TopBarProps {
  email?: string | null;
  onHome?: () => void;
  onSignOut?: () => void;
}

export function TopBar({ email, onHome, onSignOut }: TopBarProps) {
  const { t, lang, setLang } = useI18n();

  return (
    <header
      className="no-print sticky top-0 z-20 border-b"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 rounded-md text-lg font-extrabold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: 'var(--brand)' }}
          >
            <span className="flex flex-col gap-[3px]">
              <span className="block h-[3px] w-4 rounded" style={{ background: 'var(--accent)' }} />
              <span className="block h-[3px] w-3 rounded" style={{ background: 'var(--accent)' }} />
              <span className="block h-[3px] w-4 rounded" style={{ background: 'var(--accent)' }} />
            </span>
          </span>
          {t('appName')}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t('language')}
          </button>
          {email && (
            <>
              <span className="hidden text-sm sm:inline" style={{ color: 'var(--text-muted)' }}>
                {email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
