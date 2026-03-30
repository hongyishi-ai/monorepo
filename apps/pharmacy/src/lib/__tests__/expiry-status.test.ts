import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { getExpiryStatus, getMultiBatchExpiryStatus } from '../utils';

describe('Expiry Status Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15')); // 设置固定的测试时间
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getExpiryStatus', () => {
    it('should return expired for past dates', () => {
      expect(getExpiryStatus('2024-01-14')).toBe('expired'); // 昨天
      expect(getExpiryStatus('2024-01-15')).toBe('expired'); // 今天
      expect(getExpiryStatus('2024-01-10')).toBe('expired'); // 5天前
    });

    it('should return expiring for dates within warning period', () => {
      expect(getExpiryStatus('2024-01-16')).toBe('expiring'); // 明天
      expect(getExpiryStatus('2024-01-30')).toBe('expiring'); // 15天后
      expect(getExpiryStatus('2024-02-14')).toBe('expiring'); // 30天后
    });

    it('should return normal for dates beyond warning period', () => {
      expect(getExpiryStatus('2024-02-15')).toBe('normal'); // 31天后
      expect(getExpiryStatus('2024-03-15')).toBe('normal'); // 60天后
    });

    it('should respect custom warning days', () => {
      expect(getExpiryStatus('2024-01-22', 7)).toBe('expiring'); // 7天后，警告期7天
      expect(getExpiryStatus('2024-01-23', 7)).toBe('normal'); // 8天后，警告期7天
    });
  });

  describe('getMultiBatchExpiryStatus', () => {
    it('should return expired if any batch is expired', () => {
      const batches = [
        { expiry_date: '2024-01-10', quantity: 5 }, // 已过期
        { expiry_date: '2024-01-20', quantity: 10 }, // 近效期
        { expiry_date: '2024-03-15', quantity: 15 }, // 正常
      ];
      expect(getMultiBatchExpiryStatus(batches)).toBe('expired');
    });

    it('should return expiring if no expired batches but has expiring batches', () => {
      const batches = [
        { expiry_date: '2024-01-20', quantity: 10 }, // 近效期
        { expiry_date: '2024-03-15', quantity: 15 }, // 正常
      ];
      expect(getMultiBatchExpiryStatus(batches)).toBe('expiring');
    });

    it('should return normal if all batches are normal', () => {
      const batches = [
        { expiry_date: '2024-03-15', quantity: 15 }, // 正常
        { expiry_date: '2024-04-15', quantity: 20 }, // 正常
      ];
      expect(getMultiBatchExpiryStatus(batches)).toBe('normal');
    });

    it('should ignore batches with zero quantity', () => {
      const batches = [
        { expiry_date: '2024-01-10', quantity: 0 }, // 已过期但无库存
        { expiry_date: '2024-03-15', quantity: 15 }, // 正常
      ];
      expect(getMultiBatchExpiryStatus(batches)).toBe('normal');
    });

    it('should return normal for empty batches array', () => {
      expect(getMultiBatchExpiryStatus([])).toBe('normal');
    });

    it('should return normal if all batches have zero quantity', () => {
      const batches = [
        { expiry_date: '2024-01-10', quantity: 0 },
        { expiry_date: '2024-01-20', quantity: 0 },
      ];
      expect(getMultiBatchExpiryStatus(batches)).toBe('normal');
    });

    it('should respect custom warning days', () => {
      const batches = [
        { expiry_date: '2024-01-22', quantity: 10 }, // 7天后
      ];
      expect(getMultiBatchExpiryStatus(batches, 7)).toBe('expiring');
      expect(getMultiBatchExpiryStatus(batches, 5)).toBe('normal');
    });
  });

  describe('Edge cases', () => {
    it('should handle Date objects', () => {
      const futureDate = new Date('2024-01-20');
      const pastDate = new Date('2024-01-10');

      expect(getExpiryStatus(futureDate)).toBe('expiring');
      expect(getExpiryStatus(pastDate)).toBe('expired');
    });

    it('should handle invalid dates gracefully', () => {
      // 这些测试可能需要根据实际的错误处理逻辑调整
      expect(() => getExpiryStatus('invalid-date')).not.toThrow();
    });
  });
});
