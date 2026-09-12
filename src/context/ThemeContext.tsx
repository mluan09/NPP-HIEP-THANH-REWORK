import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UiTheme = 'classic' | 'modern';
export type UiMode = 'light' | 'dark';

interface ThemeContextValue {
  uiTheme: UiTheme;
  uiMode: UiMode;
  setUiTheme: (theme: UiTheme) => void;
  setUiMode: (mode: UiMode) => void;
}

const THEME_KEY = 'npp_ui_theme';
const MODE_KEY = 'npp_ui_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): UiTheme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'modern' ? 'modern' : 'classic';
  } catch {
    return 'classic';
  }
}

function readStoredMode(): UiMode {
  try {
    const stored = window.localStorage.getItem(MODE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [uiTheme, setUiTheme] = useState<UiTheme>(readStoredTheme);
  const [uiMode, setUiMode] = useState<UiMode>(readStoredMode);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = uiTheme === 'classic' || (uiTheme === 'modern' && uiMode === 'dark');

    // `dark:` variants fire only when the theme is dark, so light-first
    // components (base light + dark: overrides) render correctly in modern-light.
    root.classList.toggle('dark', isDark);
    root.classList.toggle('ui-modern', uiTheme === 'modern');
    root.classList.toggle('ui-dark', uiTheme === 'modern' && uiMode === 'dark');

    try {
      window.localStorage.setItem(THEME_KEY, uiTheme);
      window.localStorage.setItem(MODE_KEY, uiMode);
    } catch {
      // Ignore storage failures; UI still works for current session.
    }
  }, [uiTheme, uiMode]);

  const value = useMemo(
    () => ({ uiTheme, uiMode, setUiTheme, setUiMode }),
    [uiTheme, uiMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
