import { Languages, Library, LogOut } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface TopBarProps {
  email?: string | null;
  onHome?: () => void;
  onSignOut?: () => void;
  /** Set only for admins. */
  onLibrary?: () => void;
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="rgba(108,182,255,0.08)" stroke="var(--border-strong)" />
      <path d="M8 9h16M8 16h11M8 23h16" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 13v6" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TopBar({ email, onHome, onSignOut, onLibrary }: TopBarProps) {
  const { t, lang, setLang } = useI18n();

  return (
    <header
      className="no-print sticky top-0 z-20 border-b backdrop-blur-md"
      style={{ background: 'rgba(6,16,29,0.72)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 rounded-md text-lg font-extrabold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          <LogoMark />
          <span>
            Expert<span style={{ color: 'var(--accent)' }}>Hub</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {onLibrary && (
            <button
              type="button"
              onClick={onLibrary}
              className="btn-line flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
              aria-label={t('library')}
            >
              <Library className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('library')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            className="btn-line flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t('language')}
          </button>
          {email && (
            <>
              <span className="mono hidden text-xs md:inline" style={{ color: 'var(--text-muted)' }} dir="ltr">
                {email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="btn-line flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
                aria-label={t('signOut')}
              >
                <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
