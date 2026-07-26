"use client";

import styles from "./switch.module.css";
import { memo, useEffect, useState } from "react";

declare global {
  var updateDOM: () => void;
}

type ColorSchemePreference = "system" | "dark" | "light";

const STORAGE_KEY = "hongyishi-blog-theme";
const modes: ColorSchemePreference[] = ["system", "dark", "light"];
const modeLabels: Record<ColorSchemePreference, string> = {
  system: "跟随系统",
  dark: "深色",
  light: "浅色",
};

function normalizeMode(value: string | null): ColorSchemePreference {
  return modes.includes(value as ColorSchemePreference)
    ? (value as ColorSchemePreference)
    : "system";
}

/** to reuse updateDOM function defined inside injected script */

/** function to be injected in script tag for avoiding FOUC (Flash of Unstyled Content) */
export const NoFOUCScript = (storageKey: string) => {
  /* can not use outside constants or function as this script will be injected in a different context */
  const [SYSTEM, DARK, LIGHT] = ["system", "dark", "light"];

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

  const media = matchMedia(`(prefers-color-scheme: ${DARK})`);

  /** function to add remove dark class */
  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    const storedMode = localStorage.getItem(storageKey);
    const mode =
      storedMode === SYSTEM || storedMode === DARK || storedMode === LIGHT
        ? storedMode
        : SYSTEM;
    const systemMode = media.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
    restoreTransitions();
  };
  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
};

let updateDOM: () => void;

/** Fallback in case injected script hasn't run yet */
const fallbackUpdateDOM = (storageKey: string) => {
  const DARK = "dark";
  const LIGHT = "light";
  const SYSTEM = "system" as const;
  const media =
    typeof window !== "undefined"
      ? matchMedia(`(prefers-color-scheme: ${DARK})`)
      : (null as any);
  const apply = () => {
    const mode = normalizeMode(localStorage.getItem(storageKey));
    const systemMode = media && media.matches ? DARK : LIGHT;
    const resolvedMode =
      mode === SYSTEM ? (systemMode as ColorSchemePreference) : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
  };
  apply();
  media?.addEventListener?.("change", apply);
  return apply;
};

/**
 * Switch button to quickly toggle user preference.
 */
const Switch = () => {
  const [mode, setMode] = useState<ColorSchemePreference>(() =>
    normalizeMode(
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null,
    ),
  );

  useEffect(() => {
    // store global functions to local variables to avoid any interference
    updateDOM = window.updateDOM ?? fallbackUpdateDOM(STORAGE_KEY);
    /** Sync the tabs */
    addEventListener("storage", (e: StorageEvent): void => {
      e.key === STORAGE_KEY && setMode(normalizeMode(e.newValue));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    updateDOM();
  }, [mode]);

  /** toggle mode */
  const handleModeSwitch = () => {
    const index = modes.indexOf(mode);
    setMode(modes[(Math.max(index, 0) + 1) % modes.length]);
  };
  return (
    <button
      suppressHydrationWarning
      className={styles.switch}
      onClick={handleModeSwitch}
      aria-label={`切换外观，当前为${modeLabels[mode]}`}
      title={`切换外观，当前为${modeLabels[mode]}`}
      data-hongyishi-global-theme-toggle
      type="button"
    />
  );
};

const Script = memo(() => (
  <script
    suppressHydrationWarning
    dangerouslySetInnerHTML={{
      __html: `(${NoFOUCScript.toString()})('${STORAGE_KEY}')`,
    }}
  />
));
Script.displayName = "ThemeSwitcherScript";

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
