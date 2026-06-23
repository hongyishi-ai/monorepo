import '@testing-library/jest-dom'

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'Storage', {
  value: MemoryStorage,
  configurable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: window.localStorage,
  configurable: true,
});

// 添加jsdom polyfills
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
});

Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  value: function() {
    this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
  writable: true,
});

// Mock canvas for color contrast tests
HTMLCanvasElement.prototype.getContext = function() {
  return {
    measureText: () => ({ width: 0 }),
    getImageData: () => ({ data: [] }),
  };
} as any;
import 'jest-axe/extend-expect' 
