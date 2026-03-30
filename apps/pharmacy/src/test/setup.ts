import '@testing-library/jest-dom';
import { URL, URLSearchParams } from 'url';

import { vi } from 'vitest';

// Polyfill URL for Node.js environment
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = URL as typeof globalThis.URL;
  globalThis.URLSearchParams =
    URLSearchParams as typeof globalThis.URLSearchParams;
}

// Mock Supabase client to avoid URL constructor issues
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
      upsert: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null })),
      limit: vi.fn(() => ({ data: [], error: null })),
      range: vi.fn(() => ({ data: [], error: null })),
      eq: vi.fn(() => ({ data: [], error: null })),
      neq: vi.fn(() => ({ data: [], error: null })),
      gt: vi.fn(() => ({ data: [], error: null })),
      gte: vi.fn(() => ({ data: [], error: null })),
      lt: vi.fn(() => ({ data: [], error: null })),
      lte: vi.fn(() => ({ data: [], error: null })),
      like: vi.fn(() => ({ data: [], error: null })),
      ilike: vi.fn(() => ({ data: [], error: null })),
      is: vi.fn(() => ({ data: [], error: null })),
      in: vi.fn(() => ({ data: [], error: null })),
      contains: vi.fn(() => ({ data: [], error: null })),
      containedBy: vi.fn(() => ({ data: [], error: null })),
      rangeGt: vi.fn(() => ({ data: [], error: null })),
      rangeGte: vi.fn(() => ({ data: [], error: null })),
      rangeLt: vi.fn(() => ({ data: [], error: null })),
      rangeLte: vi.fn(() => ({ data: [], error: null })),
      rangeAdjacent: vi.fn(() => ({ data: [], error: null })),
      overlaps: vi.fn(() => ({ data: [], error: null })),
      textSearch: vi.fn(() => ({ data: [], error: null })),
      match: vi.fn(() => ({ data: [], error: null })),
      not: vi.fn(() => ({ data: [], error: null })),
      or: vi.fn(() => ({ data: [], error: null })),
      filter: vi.fn(() => ({ data: [], error: null })),
      single: vi.fn(() => ({ data: null, error: null })),
      maybeSingle: vi.fn(() => ({ data: null, error: null })),
    })),
    rpc: vi.fn(() => ({ data: null, error: null })),
    auth: {
      signUp: vi.fn(() => ({
        data: { user: null, session: null },
        error: null,
      })),
      signInWithPassword: vi.fn(() => ({
        data: { user: null, session: null },
        error: null,
      })),
      signOut: vi.fn(() => ({ error: null })),
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
      updateUser: vi.fn(() => ({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: null, error: null })),
        download: vi.fn(() => ({ data: null, error: null })),
        remove: vi.fn(() => ({ data: null, error: null })),
        list: vi.fn(() => ({ data: [], error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-url' } })),
      })),
    },
  })),
}));

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver =
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

// Mock IntersectionObserver
(
  globalThis as typeof globalThis & { IntersectionObserver: unknown }
).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock AudioContext for notification sounds
(globalThis as typeof globalThis & { AudioContext: unknown }).AudioContext = vi
  .fn()
  .mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 0 },
    })),
    destination: {},
  }));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: vi.fn().mockResolvedValue('granted'),
});

// Mock FileReader with proper type compatibility
class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readyState = MockFileReader.EMPTY;
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;

  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onloadstart:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
    | null = null;
  onloadend:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
    | null = null;
  onprogress:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
    | null = null;

  readAsArrayBuffer = vi.fn();
  readAsText = vi.fn();
  readAsDataURL = vi.fn();
  readAsBinaryString = vi.fn();
  abort = vi.fn();

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}

// @ts-expect-error - Intentionally overriding global FileReader for testing
(globalThis as typeof globalThis & { FileReader: unknown }).FileReader =
  MockFileReader;

// Mock URL.createObjectURL and revokeObjectURL
const OriginalURL = globalThis.URL;

// Create a mock URL constructor that extends the original
class MockURL extends OriginalURL {
  static createObjectURL = vi.fn(() => 'mocked-url');
  static revokeObjectURL = vi.fn();
  static canParse = OriginalURL.canParse;
  static parse = OriginalURL.parse;
}

// Override global URL for testing
(globalThis as typeof globalThis & { URL: unknown }).URL = MockURL;

// Mock crypto for UUID generation
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid'),
    getRandomValues: vi.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock navigator.mediaDevices for camera access
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => []),
    }),
    enumerateDevices: vi.fn().mockResolvedValue([]),
  },
});

// Mock console methods to reduce noise in tests
(globalThis as typeof globalThis & { console: typeof console }).console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};
