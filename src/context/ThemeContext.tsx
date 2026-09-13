import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';

export type LayoutMode = 'classic' | 'modern';
export type UiTheme = LayoutMode;

interface LayoutContextValue {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode | ((prev: LayoutMode) => LayoutMode)) => void;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [layoutMode, setLayoutMode] = usePersistedState<LayoutMode>('npp_layout_mode', 'classic');

  useEffect(() => {
    const root = document.documentElement;
    // Luôn cố định dark mode, modern dùng token dark
    root.classList.add('dark');
    root.classList.toggle('ui-modern', layoutMode === 'modern');
    root.classList.toggle('ui-dark', layoutMode === 'modern');
  }, [layoutMode]);

  const value = useMemo(
    () => ({ layoutMode, setLayoutMode }),
    [layoutMode, setLayoutMode],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used within ThemeProvider');
  }
  return ctx;
}

// Giữ tương thích ngược cho useTheme
export function useTheme() {
  const { layoutMode, setLayoutMode } = useLayout();
  return {
    uiTheme: layoutMode,
    setUiTheme: (theme: LayoutMode) => setLayoutMode(theme),
    layoutMode,
    setLayoutMode,
    isDark: true,
  };
}
