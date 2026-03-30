/**
 * 优化的扫码状态管理 Hook
 * 解决无限循环问题，提供稳定的状态选择器
 */

import { useCallback, useMemo } from 'react';

import { useScanStore } from '@/stores/scan.store';
import type { ScannedItem } from '@/stores/scan.store';

/**
 * 扫码状态 Hook
 * 提供稳定的状态选择器，避免无限重渲染
 */
export function useScanState() {
  const currentScan = useScanStore(state => state.currentScan);
  const isScanning = useScanStore(state => state.isScanning);
  const scanError = useScanStore(state => state.scanError);
  const scanMode = useScanStore(state => state.scanMode);
  const deviceStatus = useScanStore(state => state.deviceStatus);
  const continuousMode = useScanStore(state => state.continuousMode);
  const lastScanTime = useScanStore(state => state.lastScanTime);

  return useMemo(
    () => ({
      currentScan,
      isScanning,
      scanError,
      scanMode,
      deviceStatus,
      continuousMode,
      lastScanTime,
    }),
    [
      currentScan,
      isScanning,
      scanError,
      scanMode,
      deviceStatus,
      continuousMode,
      lastScanTime,
    ]
  );
}

/**
 * 扫码操作 Hook
 * 提供稳定的操作函数，避免无限重渲染
 */
export function useScanActions() {
  const setScanResult = useScanStore(state => state.setScanResult);
  const clearScan = useScanStore(state => state.clearScan);
  const setScanning = useScanStore(state => state.setScanning);
  const setScanError = useScanStore(state => state.setScanError);
  const setScanMode = useScanStore(state => state.setScanMode);
  const setContinuousMode = useScanStore(state => state.setContinuousMode);
  const setDeviceStatus = useScanStore(state => state.setDeviceStatus);
  const rescan = useScanStore(state => state.rescan);

  return useMemo(
    () => ({
      setScanResult,
      clearScan,
      setScanning,
      setScanError,
      setScanMode,
      setContinuousMode,
      setDeviceStatus,
      rescan,
    }),
    [
      setScanResult,
      clearScan,
      setScanning,
      setScanError,
      setScanMode,
      setContinuousMode,
      setDeviceStatus,
      rescan,
    ]
  );
}

/**
 * 扫码历史 Hook
 * 提供稳定的历史记录状态和操作
 */
export function useScanHistory() {
  const scanHistory = useScanStore(state => state.scanHistory);
  const addToHistory = useScanStore(state => state.addToHistory);
  const clearHistory = useScanStore(state => state.clearHistory);
  const selectFromHistory = useScanStore(state => state.selectFromHistory);
  const removeFromHistory = useScanStore(state => state.removeFromHistory);

  return useMemo(
    () => ({
      scanHistory,
      addToHistory,
      clearHistory,
      selectFromHistory,
      removeFromHistory,
    }),
    [
      scanHistory,
      addToHistory,
      clearHistory,
      selectFromHistory,
      removeFromHistory,
    ]
  );
}

/**
 * 扫码成功处理 Hook
 * 提供稳定的扫码成功回调
 */
export function useScanSuccess(onScanSuccess?: (barcode: string) => void) {
  const { setScanResult, setScanError, setDeviceStatus } = useScanActions();

  return useCallback(
    (barcode: string) => {
      try {
        // 创建扫码项目
        const scannedItem: ScannedItem = {
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          barcode: barcode.trim(),
          timestamp: Date.now(),
          type: 'medicine', // 默认为药品类型
        };

        // 设置扫码结果
        setScanResult(scannedItem);
        setScanError(null);
        setDeviceStatus('idle');

        // 调用外部回调
        if (onScanSuccess) {
          onScanSuccess(barcode.trim());
        }
      } catch (error) {
        console.error('处理扫码结果失败:', error);
        setScanError('处理扫码结果失败');
      }
    },
    [setScanResult, setScanError, setDeviceStatus, onScanSuccess]
  );
}

/**
 * 扫码错误处理 Hook
 * 提供稳定的扫码错误回调
 */
export function useScanError(onScanError?: (error: string) => void) {
  const { setScanError, setDeviceStatus } = useScanActions();

  return useCallback(
    (error: string) => {
      setScanError(error);
      setDeviceStatus('error');

      // 调用外部回调
      if (onScanError) {
        onScanError(error);
      }
    },
    [setScanError, setDeviceStatus, onScanError]
  );
}

/**
 * 扫码模式管理 Hook
 * 提供扫码模式的设置和清理
 */
export function useScanMode(mode: 'inbound' | 'outbound' | 'query' | null) {
  const setScanMode = useScanStore(state => state.setScanMode);

  // 设置扫码模式
  const setMode = useCallback(() => {
    setScanMode(mode);
  }, [setScanMode, mode]);

  // 清理扫码模式
  const clearMode = useCallback(() => {
    setScanMode(null);
  }, [setScanMode]);

  return { setMode, clearMode };
}

/**
 * 当前扫码结果 Hook
 * 单独获取当前扫码结果，避免不必要的重渲染
 */
export function useCurrentScan() {
  return useScanStore(state => state.currentScan);
}

/**
 * 扫码状态 Hook
 * 单独获取扫码状态，避免不必要的重渲染
 */
export function useIsScanning() {
  return useScanStore(state => state.isScanning);
}

/**
 * 扫码错误 Hook
 * 单独获取扫码错误，避免不必要的重渲染
 */
export function useScanErrorState() {
  return useScanStore(state => state.scanError);
}

/**
 * 设备状态 Hook
 * 单独获取设备状态，避免不必要的重渲染
 */
export function useDeviceStatus() {
  return useScanStore(state => state.deviceStatus);
}
