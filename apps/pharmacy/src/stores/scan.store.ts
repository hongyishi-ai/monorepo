/**
 * 扫码状态管理 Store
 * 使用 Zustand 管理扫码相关状态和操作
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 扫码项目类型
export interface ScannedItem {
  id: string;
  barcode: string;
  timestamp: number;
  type: 'medicine' | 'batch' | 'unknown';
  data?: Record<string, unknown>; // 扫码解析出的数据
}

// 扫码状态
export interface ScanState {
  // 当前扫码结果
  currentScan: ScannedItem | null;
  // 是否正在扫码
  isScanning: boolean;
  // 扫码历史记录
  scanHistory: ScannedItem[];
  // 扫码错误
  scanError: string | null;
  // 扫码模式 ('inbound' | 'outbound' | 'query')
  scanMode: 'inbound' | 'outbound' | 'query' | null;
  // 是否启用连续扫码
  continuousMode: boolean;
  // 扫码设备状态
  deviceStatus: 'idle' | 'active' | 'error' | 'permission-denied';
  // 最后扫码时间
  lastScanTime: number | null;
}

// 扫码操作
export interface ScanActions {
  // 设置扫码结果
  setScanResult: (item: ScannedItem) => void;
  // 清除当前扫码
  clearScan: () => void;
  // 设置扫码状态
  setScanning: (isScanning: boolean) => void;
  // 添加到历史记录
  addToHistory: (item: ScannedItem) => void;
  // 清除历史记录
  clearHistory: () => void;
  // 设置扫码错误
  setScanError: (error: string | null) => void;
  // 设置扫码模式
  setScanMode: (mode: 'inbound' | 'outbound' | 'query' | null) => void;
  // 设置连续扫码模式
  setContinuousMode: (enabled: boolean) => void;
  // 设置设备状态
  setDeviceStatus: (status: ScanState['deviceStatus']) => void;
  // 重新扫码
  rescan: () => void;
  // 从历史记录中选择
  selectFromHistory: (item: ScannedItem) => void;
  // 删除历史记录项
  removeFromHistory: (id: string) => void;
}

// 扫码 Store 类型
type ScanStore = ScanState & ScanActions;

export const useScanStore = create<ScanStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    currentScan: null,
    isScanning: false,
    scanHistory: [],
    scanError: null,
    scanMode: null,
    continuousMode: false,
    deviceStatus: 'idle',
    lastScanTime: null,

    // 设置扫码结果
    setScanResult: (item: ScannedItem) => {
      set({
        currentScan: item,
        isScanning: false,
        scanError: null,
        lastScanTime: Date.now(),
      });

      // 自动添加到历史记录
      get().addToHistory(item);

      // 如果是连续扫码模式，短暂延迟后重新开始扫码
      if (get().continuousMode) {
        setTimeout(() => {
          set({ isScanning: true });
        }, 1000);
      }
    },

    // 清除当前扫码
    clearScan: () =>
      set({
        currentScan: null,
        scanError: null,
      }),

    // 设置扫码状态
    setScanning: (isScanning: boolean) => {
      set({
        isScanning,
        deviceStatus: isScanning ? 'active' : 'idle',
        scanError: isScanning ? null : get().scanError,
      });
    },

    // 添加到历史记录
    addToHistory: (item: ScannedItem) => {
      const { scanHistory } = get();

      // 避免重复添加相同条码的记录（5秒内）
      const recentScan = scanHistory.find(
        h => h.barcode === item.barcode && Date.now() - h.timestamp < 5000
      );

      if (!recentScan) {
        const newHistory = [item, ...scanHistory].slice(0, 50); // 保留最近50条记录
        set({ scanHistory: newHistory });
      }
    },

    // 清除历史记录
    clearHistory: () => set({ scanHistory: [] }),

    // 设置扫码错误
    setScanError: (error: string | null) =>
      set({
        scanError: error,
        isScanning: false,
        deviceStatus: error ? 'error' : 'idle',
      }),

    // 设置扫码模式
    setScanMode: (mode: 'inbound' | 'outbound' | 'query' | null) => {
      set({
        scanMode: mode,
        // 切换模式时清除当前扫码和错误
        currentScan: null,
        scanError: null,
      });
    },

    // 设置连续扫码模式
    setContinuousMode: (enabled: boolean) => set({ continuousMode: enabled }),

    // 设置设备状态
    setDeviceStatus: (status: ScanState['deviceStatus']) => {
      set({ deviceStatus: status });

      // 如果设备出错，停止扫码
      if (status === 'error' || status === 'permission-denied') {
        set({
          isScanning: false,
          scanError:
            status === 'permission-denied'
              ? '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问'
              : '扫码设备出现错误',
        });
      }
    },

    // 重新扫码
    rescan: () => {
      set({
        currentScan: null,
        scanError: null,
        isScanning: true,
        deviceStatus: 'active',
      });
    },

    // 从历史记录中选择
    selectFromHistory: (item: ScannedItem) => {
      set({
        currentScan: item,
        isScanning: false,
        scanError: null,
      });
    },

    // 删除历史记录项
    removeFromHistory: (id: string) => {
      const { scanHistory } = get();
      set({
        scanHistory: scanHistory.filter(item => item.id !== id),
      });
    },
  }))
);

// 扫码工具函数
export const createScannedItem = (
  barcode: string,
  type: ScannedItem['type'] = 'unknown',
  data?: Record<string, unknown>
): ScannedItem => ({
  id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  barcode,
  timestamp: Date.now(),
  type,
  data,
});

// 验证条码格式
export const validateBarcode = (barcode: string): boolean => {
  // 基本条码格式验证
  if (!barcode || typeof barcode !== 'string') return false;

  // 长度检查 (6-20位)
  if (barcode.length < 6 || barcode.length > 20) return false;

  // 字符检查 (只允许数字和字母)
  const validPattern = /^[A-Za-z0-9]+$/;
  return validPattern.test(barcode);
};

// 解析条码数据
export const parseBarcodeData = (
  barcode: string
): { type: ScannedItem['type']; data?: Record<string, unknown> } => {
  // 这里可以根据条码格式规则来解析不同类型的条码
  // 目前简单实现，后续可以扩展

  if (!validateBarcode(barcode)) {
    return { type: 'unknown' };
  }

  // 简单的类型判断逻辑
  if (barcode.length === 13 && /^\d+$/.test(barcode)) {
    // EAN-13 格式，通常是药品条码
    return {
      type: 'medicine',
      data: { format: 'EAN-13' },
    };
  }

  if (barcode.includes('BATCH') || barcode.includes('LOT')) {
    // 包含批次信息的条码
    return {
      type: 'batch',
      data: { format: 'batch' },
    };
  }

  return { type: 'medicine' }; // 默认为药品类型
};

// 性能优化的扫码状态选择器 hooks
export const useScanState = () =>
  useScanStore(state => ({
    currentScan: state.currentScan,
    isScanning: state.isScanning,
    scanError: state.scanError,
    scanMode: state.scanMode,
    deviceStatus: state.deviceStatus,
  }));

export const useScanHistory = () =>
  useScanStore(state => ({
    scanHistory: state.scanHistory,
    addToHistory: state.addToHistory,
    clearHistory: state.clearHistory,
    selectFromHistory: state.selectFromHistory,
    removeFromHistory: state.removeFromHistory,
  }));

export const useScanActions = () =>
  useScanStore(state => ({
    setScanResult: state.setScanResult,
    clearScan: state.clearScan,
    setScanning: state.setScanning,
    setScanError: state.setScanError,
    setScanMode: state.setScanMode,
    setContinuousMode: state.setContinuousMode,
    setDeviceStatus: state.setDeviceStatus,
    rescan: state.rescan,
  }));

// 单独的状态选择器，避免不必要的重渲染
export const useCurrentScan = () => useScanStore(state => state.currentScan);
export const useIsScanning = () => useScanStore(state => state.isScanning);
export const useScanError = () => useScanStore(state => state.scanError);
export const useScanMode = () => useScanStore(state => state.scanMode);
export const useDeviceStatus = () => useScanStore(state => state.deviceStatus);
