import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createScannedItem,
  parseBarcodeData,
  useScanStore,
  validateBarcode,
} from '../scan.store';

describe('scan store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useScanStore.setState({
      currentScan: null,
      isScanning: false,
      scanHistory: [],
      scanError: null,
      scanMode: null,
      continuousMode: false,
      deviceStatus: 'idle',
      lastScanTime: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('scan operations', () => {
    it('should set scan result correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setScanResult(scannedItem);
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toEqual(scannedItem);
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toBeNull();
      expect(state.lastScanTime).toBeTruthy();
      expect(state.scanHistory).toHaveLength(1);
    });

    it('should clear scan correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setScanResult(scannedItem);
        store.clearScan();
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toBeNull();
      expect(state.scanError).toBeNull();
    });

    it('should set scanning status correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanning(true);
      });

      let state = useScanStore.getState();
      expect(state.isScanning).toBe(true);
      expect(state.deviceStatus).toBe('active');

      act(() => {
        store.setScanning(false);
      });

      state = useScanStore.getState();
      expect(state.isScanning).toBe(false);
      expect(state.deviceStatus).toBe('idle');
    });

    it('should set scan error correctly', () => {
      const store = useScanStore.getState();
      const errorMessage = '扫码失败';

      act(() => {
        store.setScanError(errorMessage);
      });

      const state = useScanStore.getState();
      expect(state.scanError).toBe(errorMessage);
      expect(state.isScanning).toBe(false);
      expect(state.deviceStatus).toBe('error');
    });

    it('should clear error when setting to null', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanError('错误');
        store.setScanError(null);
      });

      const state = useScanStore.getState();
      expect(state.scanError).toBeNull();
      expect(state.deviceStatus).toBe('idle');
    });
  });

  describe('scan modes', () => {
    it('should set scan mode correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanMode('inbound');
      });

      let state = useScanStore.getState();
      expect(state.scanMode).toBe('inbound');

      act(() => {
        store.setScanMode('outbound');
      });

      state = useScanStore.getState();
      expect(state.scanMode).toBe('outbound');

      act(() => {
        store.setScanMode(null);
      });

      state = useScanStore.getState();
      expect(state.scanMode).toBeNull();
    });

    it('should clear current scan when changing mode', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setScanResult(scannedItem);
        store.setScanMode('outbound');
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toBeNull();
      expect(state.scanError).toBeNull();
      expect(state.scanMode).toBe('outbound');
    });

    it('should set continuous mode correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setContinuousMode(true);
      });

      expect(useScanStore.getState().continuousMode).toBe(true);

      act(() => {
        store.setContinuousMode(false);
      });

      expect(useScanStore.getState().continuousMode).toBe(false);
    });
  });

  describe('continuous scanning', () => {
    it('should restart scanning in continuous mode', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setContinuousMode(true);
        store.setScanResult(scannedItem);
      });

      expect(useScanStore.getState().isScanning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useScanStore.getState().isScanning).toBe(true);
    });

    it('should not restart scanning when not in continuous mode', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setContinuousMode(false);
        store.setScanResult(scannedItem);
      });

      expect(useScanStore.getState().isScanning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useScanStore.getState().isScanning).toBe(false);
    });
  });

  describe('device status', () => {
    it('should set device status correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setDeviceStatus('active');
      });

      expect(useScanStore.getState().deviceStatus).toBe('active');

      act(() => {
        store.setDeviceStatus('error');
      });

      expect(useScanStore.getState().deviceStatus).toBe('error');
    });

    it('should stop scanning when device has error', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanning(true);
        store.setDeviceStatus('error');
      });

      const state = useScanStore.getState();
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toBeTruthy();
    });

    it('should stop scanning when permission denied', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanning(true);
        store.setDeviceStatus('permission-denied');
      });

      const state = useScanStore.getState();
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toContain('摄像头权限被拒绝');
    });
  });

  describe('scan history', () => {
    it('should add to history correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem);
      });

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(1);
      expect(state.scanHistory[0]).toEqual(scannedItem);
    });

    it('should not add duplicate recent scans', () => {
      const store = useScanStore.getState();
      const scannedItem1 = createScannedItem('1234567890123', 'medicine');
      const scannedItem2 = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem1);
        store.addToHistory(scannedItem2);
      });

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(1);
    });

    it('should add duplicate scans after time threshold', () => {
      const store = useScanStore.getState();
      const scannedItem1 = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem1);
      });

      act(() => {
        vi.advanceTimersByTime(6000); // 6 seconds
      });

      const scannedItem2 = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem2);
      });

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(2);
    });

    it('should limit history to 50 items', () => {
      const store = useScanStore.getState();

      act(() => {
        for (let i = 0; i < 60; i++) {
          const scannedItem = createScannedItem(`barcode${i}`, 'medicine');
          store.addToHistory(scannedItem);
        }
      });

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(50);
    });

    it('should clear history correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.addToHistory(createScannedItem('123', 'medicine'));
        store.addToHistory(createScannedItem('456', 'medicine'));
        store.clearHistory();
      });

      expect(useScanStore.getState().scanHistory).toHaveLength(0);
    });

    it('should select from history correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem);
        store.selectFromHistory(scannedItem);
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toEqual(scannedItem);
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toBeNull();
    });

    it('should remove from history correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.addToHistory(scannedItem);
        store.removeFromHistory(scannedItem.id);
      });

      expect(useScanStore.getState().scanHistory).toHaveLength(0);
    });
  });

  describe('rescan functionality', () => {
    it('should rescan correctly', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanError('扫码失败');
        store.rescan();
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toBeNull();
      expect(state.scanError).toBeNull();
      expect(state.isScanning).toBe(true);
      expect(state.deviceStatus).toBe('active');
    });
  });
});

describe('scan utilities', () => {
  describe('createScannedItem', () => {
    it('should create scanned item with default type', () => {
      const item = createScannedItem('1234567890123');

      expect(item.barcode).toBe('1234567890123');
      expect(item.type).toBe('unknown');
      expect(item.id).toBeTruthy();
      expect(item.timestamp).toBeTruthy();
    });

    it('should create scanned item with specified type', () => {
      const item = createScannedItem('1234567890123', 'medicine', {
        format: 'EAN-13',
      });

      expect(item.barcode).toBe('1234567890123');
      expect(item.type).toBe('medicine');
      expect(item.data).toEqual({ format: 'EAN-13' });
    });
  });

  describe('validateBarcode', () => {
    it('should validate correct barcodes', () => {
      expect(validateBarcode('1234567890123')).toBe(true);
      expect(validateBarcode('ABC123DEF456')).toBe(true);
      expect(validateBarcode('123456')).toBe(true);
      expect(validateBarcode('12345678901234567890')).toBe(true);
    });

    it('should reject invalid barcodes', () => {
      expect(validateBarcode('')).toBe(false);
      expect(validateBarcode('12345')).toBe(false); // too short
      expect(validateBarcode('123456789012345678901')).toBe(false); // too long
      expect(validateBarcode('123-456-789')).toBe(false); // invalid characters
      expect(validateBarcode('123 456 789')).toBe(false); // spaces
      expect(validateBarcode(null as unknown as string)).toBe(false);
      expect(validateBarcode(undefined as unknown as string)).toBe(false);
      expect(validateBarcode(123 as unknown as string)).toBe(false);
    });
  });

  describe('parseBarcodeData', () => {
    it('should parse EAN-13 barcode', () => {
      const result = parseBarcodeData('1234567890123');

      expect(result.type).toBe('medicine');
      expect(result.data?.format).toBe('EAN-13');
    });

    it('should parse batch barcode', () => {
      const result = parseBarcodeData('BATCH123456');

      expect(result.type).toBe('batch');
      expect(result.data?.format).toBe('batch');
    });

    it('should parse LOT barcode', () => {
      const result = parseBarcodeData('LOT789ABC');

      expect(result.type).toBe('batch');
      expect(result.data?.format).toBe('batch');
    });

    it('should default to medicine type', () => {
      const result = parseBarcodeData('ABC123DEF');

      expect(result.type).toBe('medicine');
    });

    it('should return unknown for invalid barcode', () => {
      const result = parseBarcodeData('123');

      expect(result.type).toBe('unknown');
    });
  });
});
