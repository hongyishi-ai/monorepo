import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationStore } from '../../stores/notification.store';
import {
  createScannedItem,
  parseBarcodeData,
  useScanStore,
  validateBarcode,
} from '../../stores/scan.store';

// Mock HTML5 QR Code scanner
const mockHtml5QrCode = {
  start: vi.fn(),
  stop: vi.fn(),
  clear: vi.fn(),
  getState: vi.fn(() => 1), // SCANNING state
};

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn(() => mockHtml5QrCode),
  Html5QrcodeScannerState: {
    UNKNOWN: 0,
    NOT_STARTED: 1,
    SCANNING: 2,
    PAUSED: 3,
  },
}));

// Mock camera permissions
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(() =>
      Promise.resolve([
        { deviceId: 'camera1', kind: 'videoinput', label: 'Camera 1' },
      ])
    ),
  },
  writable: true,
});

describe('Scanner Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset scan store
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

    // Reset notification store
    useNotificationStore.setState({
      notifications: [],
      reminders: [],
      unreadCount: 0,
      showPanel: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Barcode Scanning', () => {
    it('should validate barcode format correctly', () => {
      // 有效条码
      expect(validateBarcode('1234567890123')).toBe(true);
      expect(validateBarcode('ABC123DEF456')).toBe(true);
      expect(validateBarcode('123456')).toBe(true);

      // 无效条码
      expect(validateBarcode('')).toBe(false);
      expect(validateBarcode('12345')).toBe(false); // 太短
      expect(validateBarcode('123456789012345678901')).toBe(false); // 太长
      expect(validateBarcode('123-456-789')).toBe(false); // 包含特殊字符
      expect(validateBarcode(null as unknown as string)).toBe(false);
      expect(validateBarcode(undefined as unknown as string)).toBe(false);
    });

    it('should parse barcode data correctly', () => {
      // EAN-13 条码
      const ean13Result = parseBarcodeData('1234567890123');
      expect(ean13Result.type).toBe('medicine');
      expect(ean13Result.data?.format).toBe('EAN-13');

      // 批次条码
      const batchResult = parseBarcodeData('BATCH123456');
      expect(batchResult.type).toBe('batch');
      expect(batchResult.data?.format).toBe('batch');

      // LOT 条码
      const lotResult = parseBarcodeData('LOT789ABC');
      expect(lotResult.type).toBe('batch');
      expect(lotResult.data?.format).toBe('batch');

      // 默认药品类型
      const defaultResult = parseBarcodeData('ABC123DEF');
      expect(defaultResult.type).toBe('medicine');

      // 无效条码
      const invalidResult = parseBarcodeData('123');
      expect(invalidResult.type).toBe('unknown');
    });

    it('should create scanned item correctly', () => {
      const barcode = '1234567890123';
      const scannedItem = createScannedItem(barcode, 'medicine', {
        format: 'EAN-13',
      });

      expect(scannedItem.barcode).toBe(barcode);
      expect(scannedItem.type).toBe('medicine');
      expect(scannedItem.data?.format).toBe('EAN-13');
      expect(scannedItem.id).toBeTruthy();
      expect(scannedItem.timestamp).toBeTruthy();
    });
  });

  describe('Scan Store Integration', () => {
    it('should handle successful scan', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setScanResult(scannedItem);
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toEqual(scannedItem);
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toBeNull();
      expect(state.scanHistory).toHaveLength(1);
      expect(state.lastScanTime).toBeTruthy();
    });

    it('should handle scan error', () => {
      const store = useScanStore.getState();
      const errorMessage = '扫码失败：摄像头无法访问';

      act(() => {
        store.setScanError(errorMessage);
      });

      const state = useScanStore.getState();
      expect(state.scanError).toBe(errorMessage);
      expect(state.isScanning).toBe(false);
      expect(state.deviceStatus).toBe('error');
    });

    it('should handle continuous scanning mode', () => {
      vi.useFakeTimers();

      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      act(() => {
        store.setContinuousMode(true);
        store.setScanResult(scannedItem);
      });

      expect(useScanStore.getState().isScanning).toBe(false);

      // 模拟延迟后重新开始扫码
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useScanStore.getState().isScanning).toBe(true);

      vi.useRealTimers();
    });

    it('should manage scan history correctly', () => {
      const store = useScanStore.getState();
      const item1 = createScannedItem('1234567890123', 'medicine');
      const item2 = createScannedItem('9876543210987', 'medicine');

      act(() => {
        store.addToHistory(item1);
        store.addToHistory(item2);
      });

      let state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(2);

      // 测试从历史记录中选择
      act(() => {
        store.selectFromHistory(item1);
      });

      state = useScanStore.getState();
      expect(state.currentScan).toEqual(item1);

      // 测试删除历史记录
      act(() => {
        store.removeFromHistory(item1.id);
      });

      state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(1);
      expect(state.scanHistory[0]).toEqual(item2);
    });

    it('should prevent duplicate scans in short time', () => {
      const store = useScanStore.getState();
      const barcode = '1234567890123';
      const item1 = createScannedItem(barcode, 'medicine');
      const item2 = createScannedItem(barcode, 'medicine');

      act(() => {
        store.addToHistory(item1);
        store.addToHistory(item2); // 应该被忽略，因为是重复的
      });

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(1);
    });
  });

  describe('Scan Mode Management', () => {
    it('should handle inbound scan mode', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanMode('inbound');
      });

      const state = useScanStore.getState();
      expect(state.scanMode).toBe('inbound');
      expect(state.currentScan).toBeNull(); // 切换模式时清除当前扫码
    });

    it('should handle outbound scan mode', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanMode('outbound');
      });

      const state = useScanStore.getState();
      expect(state.scanMode).toBe('outbound');
    });

    it('should handle query scan mode', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanMode('query');
      });

      const state = useScanStore.getState();
      expect(state.scanMode).toBe('query');
    });
  });

  describe('Device Status Management', () => {
    it('should handle camera permission denied', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setDeviceStatus('permission-denied');
      });

      const state = useScanStore.getState();
      expect(state.deviceStatus).toBe('permission-denied');
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toContain('摄像头权限被拒绝');
    });

    it('should handle device error', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setDeviceStatus('error');
      });

      const state = useScanStore.getState();
      expect(state.deviceStatus).toBe('error');
      expect(state.isScanning).toBe(false);
      expect(state.scanError).toBeTruthy();
    });

    it('should handle active scanning state', () => {
      const store = useScanStore.getState();

      act(() => {
        store.setScanning(true);
      });

      const state = useScanStore.getState();
      expect(state.isScanning).toBe(true);
      expect(state.deviceStatus).toBe('active');
    });
  });

  describe('Integration with Notifications', () => {
    it('should create notification for scan errors', () => {
      const scanStore = useScanStore.getState();
      const notificationStore = useNotificationStore.getState();

      // 模拟扫码错误
      act(() => {
        scanStore.setScanError('扫码失败：条码格式错误');
      });

      // 手动创建通知（在实际应用中这会由组件处理）
      act(() => {
        notificationStore.addNotification({
          type: 'error',
          title: '扫码失败',
          message: '条码格式错误',
          priority: 'high',
        });
      });

      const notificationState = useNotificationStore.getState();
      expect(notificationState.notifications).toHaveLength(1);
      expect(notificationState.notifications[0].type).toBe('error');
      expect(notificationState.unreadCount).toBe(1);
    });

    it('should create notification for successful scan', () => {
      const scanStore = useScanStore.getState();
      const notificationStore = useNotificationStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      // 模拟成功扫码
      act(() => {
        scanStore.setScanResult(scannedItem);
      });

      // 手动创建成功通知
      act(() => {
        notificationStore.addNotification({
          type: 'success',
          title: '扫码成功',
          message: `已扫描条码: ${scannedItem.barcode}`,
          priority: 'medium',
          duration: 3000,
        });
      });

      const notificationState = useNotificationStore.getState();
      expect(notificationState.notifications).toHaveLength(1);
      expect(notificationState.notifications[0].type).toBe('success');
    });
  });

  describe('Rescan Functionality', () => {
    it('should handle rescan correctly', () => {
      const store = useScanStore.getState();

      // 设置初始错误状态
      act(() => {
        store.setScanError('扫码失败');
      });

      expect(useScanStore.getState().scanError).toBeTruthy();

      // 执行重新扫码
      act(() => {
        store.rescan();
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toBeNull();
      expect(state.scanError).toBeNull();
      expect(state.isScanning).toBe(true);
      expect(state.deviceStatus).toBe('active');
    });
  });

  describe('Scanner Cleanup', () => {
    it('should clear scan state correctly', () => {
      const store = useScanStore.getState();
      const scannedItem = createScannedItem('1234567890123', 'medicine');

      // 设置一些状态
      act(() => {
        store.setScanResult(scannedItem);
        store.setScanError('某个错误');
      });

      // 清除扫码状态
      act(() => {
        store.clearScan();
      });

      const state = useScanStore.getState();
      expect(state.currentScan).toBeNull();
      expect(state.scanError).toBeNull();
    });

    it('should clear scan history correctly', () => {
      const store = useScanStore.getState();
      const item1 = createScannedItem('1234567890123', 'medicine');
      const item2 = createScannedItem('9876543210987', 'medicine');

      act(() => {
        store.addToHistory(item1);
        store.addToHistory(item2);
      });

      expect(useScanStore.getState().scanHistory).toHaveLength(2);

      act(() => {
        store.clearHistory();
      });

      expect(useScanStore.getState().scanHistory).toHaveLength(0);
    });
  });
});
