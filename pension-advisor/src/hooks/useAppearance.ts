import { useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type AccentChoice = 'aurora' | 'ocean' | 'forest' | 'sunset';

const THEME_KEY = 'pension-advisor:theme';
const ACCENT_KEY = 'pension-advisor:accent';

function applyTheme(theme: ThemeChoice) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function applyAccent(accent: AccentChoice) {
  if (accent === 'aurora') {
    document.documentElement.removeAttribute('data-accent');
  } else {
    document.documentElement.setAttribute('data-accent', accent);
  }
}

export function useAppearance() {
  const [theme, setThemeState] = useState<ThemeChoice>(
    () => (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? 'system',
  );
  const [accent, setAccentState] = useState<AccentChoice>(
    () => (localStorage.getItem(ACCENT_KEY) as AccentChoice | null) ?? 'aurora',
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  return { theme, setTheme: setThemeState, accent, setAccent: setAccentState };
}
