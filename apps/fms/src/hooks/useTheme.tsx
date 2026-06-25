import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '@/lib/safe-storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'hongyishi-theme';
const LEGACY_THEME_STORAGE_KEYS = ['theme', 'hongyishi-blog-theme'];

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

function readStoredThemeMode(): ThemeMode {
  const stored = safeLocalStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(stored)) return stored;

  for (const key of LEGACY_THEME_STORAGE_KEYS) {
    const legacyValue = safeLocalStorage.getItem(key);
    if (isThemeMode(legacyValue)) {
      safeLocalStorage.setItem(THEME_STORAGE_KEY, legacyValue);
      return legacyValue;
    }
  }

  return 'system';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function applyTheme(mode: ThemeMode, resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.setAttribute('data-mode', mode);
  root.setAttribute('data-hys-theme', mode);
  root.setAttribute('data-hys-theme-resolved', resolvedTheme);
}

/**
 * useTheme Hook
 *
 * 1. 根据 localStorage 中保存的用户偏好确定主题模式。
 * 2. 在 HTML <html> 元素上切换 `dark` class，以配合 Tailwind 的暗色模式。
 * 3. 保持日间、夜间、跟随系统三态和其他子项目一致。
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readStoredThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredThemeMode()),
  );

  useEffect(() => {
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    applyTheme(mode, resolved);
    safeLocalStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const handleSystemChange = () => {
      setMode((currentMode) => {
        if (currentMode !== 'system') return currentMode;
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(currentMode, resolved);
        return currentMode;
      });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY || !isThemeMode(event.newValue)) {
        return;
      }
      setMode(event.newValue);
    };

    media?.addEventListener?.('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      media?.removeEventListener?.('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateThemeMode = useCallback(
    (nextMode: ThemeMode, x?: number, y?: number) => {
      const root =
        typeof document !== 'undefined' ? document.documentElement : null;

      if (root && typeof x === 'number' && typeof y === 'number') {
        root.style.setProperty('--x', `${x}px`);
        root.style.setProperty('--y', `${y}px`);
      }

      const switchTheme = () => {
        setMode(nextMode);
      };

      if (
        !document?.startViewTransition ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        switchTheme();
        return;
      }

      document.startViewTransition(() => {
        switchTheme();
      });
    },
    [],
  );

  /**
   * 兼容旧调用：二态切换会把偏好写为明确日间/夜间。
   */
  const toggleTheme = useCallback((x?: number, y?: number) => {
    updateThemeMode(resolvedTheme === 'light' ? 'dark' : 'light', x, y);
  }, [resolvedTheme, updateThemeMode]);

  return {
    mode,
    resolvedTheme,
    theme: resolvedTheme,
    setThemeMode: updateThemeMode,
    toggleTheme,
  };
} 
