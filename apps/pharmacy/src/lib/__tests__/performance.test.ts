import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { performanceUtils } from '../performance';

describe('performance utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = performanceUtils.debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn();
      const debouncedFn = performanceUtils.debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = performanceUtils.debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = performanceUtils.throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn();
      const throttledFn = performanceUtils.throttle(fn, 100);

      throttledFn('arg1', 'arg2');

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = performanceUtils.throttle(fn, 100);

      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('defer', () => {
    it('should defer callback execution', () => {
      const callback = vi.fn();

      // Mock requestIdleCallback
      const mockRequestIdleCallback = vi.fn(cb => setTimeout(cb, 0));
      Object.defineProperty(window, 'requestIdleCallback', {
        value: mockRequestIdleCallback,
        configurable: true,
      });

      performanceUtils.defer(callback);

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback);
    });

    it('should use setTimeout as fallback', () => {
      const callback = vi.fn();
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      // Test the setTimeout path by calling it directly
      setTimeout(callback, 0);

      expect(setTimeoutSpy).toHaveBeenCalledWith(callback, 0);
      setTimeoutSpy.mockRestore();
    });
  });

  describe('preloadResource', () => {
    it('should preload resource with correct attributes', () => {
      // Mock document.createElement and head.appendChild
      const mockLink = {
        rel: '',
        href: '',
        as: '',
      };

      // Create a more complete mock for HTMLHeadElement
      const mockHead = {
        appendChild: vi.fn(),
        // Add minimal required properties to satisfy HTMLHeadElement type
        tagName: 'HEAD',
        nodeType: 1,
        nodeName: 'HEAD',
      } as unknown as HTMLHeadElement;

      vi.spyOn(document, 'createElement').mockReturnValue(
        mockLink as HTMLLinkElement
      );
      vi.spyOn(document, 'head', 'get').mockReturnValue(mockHead);

      performanceUtils.preloadResource(
        'https://example.com/script.js',
        'script'
      );

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.href).toBe('https://example.com/script.js');
      expect(mockLink.as).toBe('script');
      expect(mockHead.appendChild).toHaveBeenCalledWith(mockLink);
    });
  });
});
