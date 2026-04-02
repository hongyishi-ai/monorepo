import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber, formatFileSize, formatRelativeTime } from './index';
import { validatePhone, validateEmail, validateIdCard, validateUrl, validateMoney } from '../validation/index';
import { createApiClient } from '../api/index';

describe('format', () => {
  describe('formatDate', () => {
    it('formats date with default pattern', () => {
      expect(formatDate('2026-04-02')).toBe('2026-04-02');
    });
    it('formats date with custom pattern', () => {
      expect(formatDate('2026-04-02T20:30:00', 'YYYY/MM/DD HH:mm')).toBe('2026/04/02 20:30');
    });
    it('handles invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('formats integer', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
    it('formats with decimals', () => {
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
    it('formats KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });
    it('formats MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });
  });
});

describe('validation', () => {
  describe('validatePhone', () => {
    it('validates correct phone', () => {
      expect(validatePhone('13812345678')).toBe(true);
    });
    it('rejects invalid phone', () => {
      expect(validatePhone('12345678901')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });
    it('rejects invalid email', () => {
      expect(validateEmail('not-an-email')).toBe(false);
    });
  });

  describe('validateIdCard', () => {
    it('validates correct id card', () => {
      // 有效身份证号（校验码 2→X）
      expect(validateIdCard('11010519491231002X')).toBe(true);
    });
    it('rejects invalid id card', () => {
      expect(validateIdCard('123456789012345678')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('validates correct url', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });
    it('rejects invalid url', () => {
      expect(validateUrl('not-a-url')).toBe(false);
    });
  });

  describe('validateMoney', () => {
    it('validates correct money', () => {
      expect(validateMoney(99.99)).toBe(true);
    });
    it('rejects too many decimals', () => {
      expect(validateMoney(99.999)).toBe(false);
    });
  });
});
