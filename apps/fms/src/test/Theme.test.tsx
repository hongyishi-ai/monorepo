import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '@/hooks/useTheme';

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, callback: (event: MediaQueryListEvent) => void) => {
        listeners.add(callback);
      },
      removeEventListener: (_event: string, callback: (event: MediaQueryListEvent) => void) => {
        listeners.delete(callback);
      },
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-mode');
    document.documentElement.removeAttribute('data-hys-theme');
    document.documentElement.removeAttribute('data-hys-theme-resolved');
    installMatchMedia(false);
  });

  it('defaults to system and resolves the current system theme', async () => {
    installMatchMedia(true);

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.mode).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement).toHaveAttribute('data-mode', 'system');
      expect(document.documentElement).toHaveAttribute('data-hys-theme', 'system');
      expect(document.documentElement).toHaveAttribute(
        'data-hys-theme-resolved',
        'dark',
      );
      expect(localStorage.getItem('hongyishi-theme')).toBe('system');
    });
  });

  it('migrates valid legacy theme keys to the unified key', async () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.mode).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(localStorage.getItem('hongyishi-theme')).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('applies explicit and system modes to the shared DOM contract', async () => {
    const system = installMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setThemeMode('light'));
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark');
      expect(document.documentElement).toHaveAttribute('data-mode', 'light');
      expect(localStorage.getItem('hongyishi-theme')).toBe('light');
    });

    act(() => result.current.setThemeMode('dark'));
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement).toHaveAttribute('data-mode', 'dark');
      expect(localStorage.getItem('hongyishi-theme')).toBe('dark');
    });

    act(() => result.current.setThemeMode('system'));
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark');
      expect(document.documentElement).toHaveAttribute('data-mode', 'system');
      expect(localStorage.getItem('hongyishi-theme')).toBe('system');
    });

    act(() => system.setMatches(true));
    await waitFor(() => {
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement).toHaveAttribute(
        'data-hys-theme-resolved',
        'dark',
      );
    });
  });

  it('syncs theme changes from other tabs', async () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      localStorage.setItem('hongyishi-theme', 'dark');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'hongyishi-theme',
          newValue: 'dark',
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.mode).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');
    });
  });
});
