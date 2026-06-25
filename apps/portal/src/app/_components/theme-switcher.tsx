"use client";

import styles from "./switch.module.css";
import { memo, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    updateDOM?: () => void;
  }
}

type ColorSchemePreference = "system" | "dark" | "light";
type ResolvedColorScheme = "dark" | "light";

const STORAGE_KEY = "hongyishi-theme";
const LEGACY_STORAGE_KEYS = ["hongyishi-blog-theme", "theme"];
const modes: ColorSchemePreference[] = ["system", "light", "dark"];
const modeLabels: Record<ColorSchemePreference, string> = {
  system: "跟随系统",
  light: "日间",
  dark: "夜间",
};

function isColorSchemePreference(value: string | null): value is ColorSchemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function readStoredMode(): ColorSchemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isColorSchemePreference(stored)) return stored;

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (isColorSchemePreference(legacyValue)) {
        window.localStorage.setItem(STORAGE_KEY, legacyValue);
        return legacyValue;
      }
    }
  } catch {
    return "system";
  }

  return "system";
}

/** to reuse updateDOM function defined inside injected script */

/** function to be injected in script tag for avoiding FOUC (Flash of Unstyled Content) */
export const NoFOUCScript = (storageKey: string, legacyStorageKeys: string[]) => {
  /* can not use outside constants or function as this script will be injected in a different context */
  const [SYSTEM, DARK, LIGHT] = ["system", "dark", "light"];

  const isValidMode = (value: string | null): value is ColorSchemePreference =>
    value === SYSTEM || value === DARK || value === LIGHT;

  const getStoredMode = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (isValidMode(stored)) return stored;

      for (const legacyKey of legacyStorageKeys) {
        const legacyValue = localStorage.getItem(legacyKey);
        if (isValidMode(legacyValue)) {
          localStorage.setItem(storageKey, legacyValue);
          return legacyValue;
        }
      }
    } catch {
      return SYSTEM;
    }

    return SYSTEM;
  };

  /** Modify transition globally to avoid patched transitions */
  const modifyTransition = () => {
    const css = document.createElement("style");
    css.textContent = "*,*:after,*:before{transition:none !important;}";
    document.head.appendChild(css);

    return () => {
      /* Force restyle */
      getComputedStyle(document.body);
      /* Wait for next tick before removing */
      setTimeout(() => document.head.removeChild(css), 1);
    };
  };

  const media =
    typeof matchMedia === "function"
      ? matchMedia(`(prefers-color-scheme: ${DARK})`)
      : null;

  /** function to add remove dark class */
  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    const mode = getStoredMode();
    const systemMode = media?.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.setAttribute("data-hys-theme", mode);
    document.documentElement.setAttribute("data-hys-theme-resolved", resolvedMode);
    restoreTransitions();
  };
  window.updateDOM();
  media?.addEventListener?.("change", window.updateDOM);
};

let updateDOM: () => void;

/** Fallback in case injected script hasn't run yet */
const fallbackUpdateDOM = (storageKey: string) => {
  const DARK = "dark";
  const LIGHT = "light";
  const SYSTEM = "system" as const;
  const media =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(`(prefers-color-scheme: ${DARK})`)
      : null;
  const apply = () => {
    const storedMode = readStoredMode();
    const mode = isColorSchemePreference(storedMode) ? storedMode : SYSTEM;
    const systemMode = media?.matches ? DARK : LIGHT;
    const resolvedMode: ResolvedColorScheme =
      mode === SYSTEM ? systemMode : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.setAttribute("data-hys-theme", mode);
    document.documentElement.setAttribute("data-hys-theme-resolved", resolvedMode);
  };
  apply();
  media?.addEventListener?.("change", apply);
  return apply;
};

/**
 * Switch button to quickly toggle user preference.
 */
const Switch = () => {
  const [mode, setMode] = useState<ColorSchemePreference>(readStoredMode);
  const [open, setOpen] = useState(false);
  const currentLabel = modeLabels[mode];

  useEffect(() => {
    // store global functions to local variables to avoid any interference
    updateDOM = window.updateDOM ?? fallbackUpdateDOM(STORAGE_KEY);
    /** Sync the tabs */
    const handleStorage = (e: StorageEvent): void => {
      if (e.key === STORAGE_KEY && isColorSchemePreference(e.newValue)) {
        setMode(e.newValue);
      }
    };
    addEventListener("storage", handleStorage);
    return () => removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Theme preference is optional; DOM state still updates.
    }
    updateDOM();
  }, [mode]);

  const items = useMemo(
    () =>
      modes.map((item) => ({
        mode: item,
        label: modeLabels[item],
        active: item === mode,
      })),
    [mode],
  );

  return (
    <div className={styles.wrapper} data-hongyishi-theme-control>
      <button
        suppressHydrationWarning
        className={styles.switch}
        aria-label={`主题：${currentLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.icon} aria-hidden="true" data-mode-icon={mode} />
        <span className={styles.label}>{currentLabel}</span>
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label="选择主题">
          {items.map((item) => (
            <button
              key={item.mode}
              className={styles.menuItem}
              data-active={item.active ? "true" : undefined}
              data-theme-mode={item.mode}
              role="menuitemradio"
              aria-checked={item.active}
              onClick={() => {
                setMode(item.mode);
                setOpen(false);
              }}
            >
              <span className={styles.menuIcon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Script = memo(() => (
  <script
    suppressHydrationWarning
    dangerouslySetInnerHTML={{
      __html: `(${NoFOUCScript.toString()})('${STORAGE_KEY}', ${JSON.stringify(LEGACY_STORAGE_KEYS)})`,
    }}
  />
));
Script.displayName = 'ThemeSwitcherScript';

/**
 * This component wich applies classes and transitions.
 */
export const ThemeSwitcher = () => {
  return (
    <>
      <Script />
      <Switch />
    </>
  );
};
