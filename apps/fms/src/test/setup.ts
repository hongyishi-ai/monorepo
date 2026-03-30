import '@testing-library/jest-dom'

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