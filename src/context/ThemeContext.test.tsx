import { cleanup, render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useLayout, useTheme } from './ThemeContext';

function ConsumerComponent() {
  const { layoutMode, setLayoutMode } = useLayout();
  const theme = useTheme();

  return (
    <div>
      <span data-testid="layout-mode">{layoutMode}</span>
      <span data-testid="is-dark">{String(theme.isDark)}</span>
      <button onClick={() => setLayoutMode('modern')}>Set Modern</button>
      <button onClick={() => setLayoutMode('classic')}>Set Classic</button>
    </div>
  );
}

describe('ThemeContext and LayoutMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.className = '';
  });

  it('always enforces dark mode on documentElement', () => {
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('manages layout mode and sets ui-modern class when modern', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(getByTestId('layout-mode').textContent).toBe('classic');
    expect(getByTestId('is-dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('ui-modern')).toBe(false);

    act(() => {
      getByText('Set Modern').click();
    });

    expect(getByTestId('layout-mode').textContent).toBe('modern');
    expect(document.documentElement.classList.contains('ui-modern')).toBe(true);
    // Dark mode is still enforced
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('ui-dark')).toBe(true);

    act(() => {
      getByText('Set Classic').click();
    });

    expect(getByTestId('layout-mode').textContent).toBe('classic');
    expect(document.documentElement.classList.contains('ui-modern')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
