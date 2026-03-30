import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cn,
  debounce,
  formatDate,
  formatDateTime,
  generateId,
  getDaysUntil,
  getDaysUntilExpiry,
  getExpiryStatus,
  getStockStatus,
  throttle,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', null, 'class3')).toBe('class1 class3');
    });

    it('should handle tailwind merge conflicts', () => {
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('2024/01/15');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBe('2024/01/15');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime string correctly', () => {
      const result = formatDateTime('2024-01-15T10:30:00');
      expect(result).toMatch(/2024\/01\/15.*10:30/);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/2024\/01\/15.*10:30/);
    });
  });

  describe('getDaysUntilExpiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate days until expiry correctly', () => {
      expect(getDaysUntilExpiry('2024-01-10')).toBe(9);
      expect(getDaysUntilExpiry('2024-01-01')).toBe(0);
      expect(getDaysUntilExpiry('2023-12-31')).toBe(-1);
    });
  });

  describe('getDaysUntil', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate days until target date correctly', () => {
      expect(getDaysUntil('2024-01-10')).toBe(10);
      expect(getDaysUntil('2024-01-01')).toBe(1);
      expect(Math.abs(getDaysUntil('2023-12-31'))).toBe(0);
    });
  });

  describe('getStockStatus', () => {
    it('should return correct stock status', () => {
      expect(getStockStatus(0, 10)).toBe('empty');
      expect(getStockStatus(5, 10)).toBe('low');
      expect(getStockStatus(10, 10)).toBe('low');
      expect(getStockStatus(15, 10)).toBe('sufficient');
    });
  });

  describe('getExpiryStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return correct expiry status', () => {
      expect(getExpiryStatus('2023-12-31')).toBe('expired');
      expect(getExpiryStatus('2024-01-15')).toBe('expiring');
      expect(getExpiryStatus('2024-02-15')).toBe('normal');
    });

    it('should respect custom warning days', () => {
      expect(getExpiryStatus('2024-01-08', 7)).toBe('expiring');
      expect(getExpiryStatus('2024-01-09', 7)).toBe('normal');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      vi.advanceTimersByTime(50);
      debouncedFn('arg2');
      vi.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      vi.advanceTimersByTime(100);
      throttledFn('arg4');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('arg4');
    });
  });
});
