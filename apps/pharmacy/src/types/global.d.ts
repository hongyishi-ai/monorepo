/**
 * Global type declarations for the application
 */

/// <reference types="node" />

declare global {
  // Node.js globals
  var process: NodeJS.Process;
  var global: typeof globalThis;
  var __dirname: string;
  var require: (id: string) => unknown;

  // Browser APIs that might not be available in test environment
  interface Window {
    ResizeObserver?: typeof ResizeObserver;
    IntersectionObserver?: typeof IntersectionObserver;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }

  // Test environment globals
  var ResizeObserver: {
    new (callback: (entries: ResizeObserverEntry[]) => void): ResizeObserver;
    prototype: ResizeObserver;
  };

  var IntersectionObserver: {
    new (
      callback: (entries: IntersectionObserverEntry[]) => void,
      options?: {
        root?: Element | null;
        rootMargin?: string;
        threshold?: number | number[];
      }
    ): IntersectionObserver;
    prototype: IntersectionObserver;
  };

  var AudioContext: {
    new (contextOptions?: { sampleRate?: number }): AudioContext;
    prototype: AudioContext;
  };

  // Notification API types
  interface NotificationOptions {
    body?: string;
    icon?: string;
    tag?: string;
    data?: unknown;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    actions?: NotificationAction[];
    badge?: string;
    dir?: NotificationDirection;
    image?: string;
    lang?: string;
    renotify?: boolean;
    vibrate?: VibratePattern;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  type NotificationDirection = 'auto' | 'ltr' | 'rtl';
  type VibratePattern = number | number[];

  // File API extensions
  interface FileReader {
    EMPTY: number;
    LOADING: number;
    DONE: number;
  }

  // Performance API extensions
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_APP_NAME: string;
      VITE_APP_VERSION: string;
      VITE_APP_ENV: string;
      [key: string]: string | undefined;
    }
  }
}

export {};
