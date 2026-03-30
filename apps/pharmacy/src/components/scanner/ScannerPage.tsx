import { useEffect } from 'react';

import { BarcodeScanner } from './BarcodeScanner';
import { ScanHistory } from './ScanHistory';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScanStore } from '@/stores/scan.store';

interface ScannerPageProps {
  title?: string;
  mode?: 'inbound' | 'outbound' | 'query';
  onScanComplete?: (barcode: string) => void;
  className?: string;
}

/**
 * 扫码页面组件
 * 集成扫码器和历史记录，提供完整的扫码功能
 */
export function ScannerPage({
  title = '扫码',
  mode = 'query',
  onScanComplete,
  className = '',
}: ScannerPageProps) {
  const currentScan = useScanStore(state => state.currentScan);
  const isScanning = useScanStore(state => state.isScanning);
  const scanError = useScanStore(state => state.scanError);
  const deviceStatus = useScanStore(state => state.deviceStatus);
  const setScanMode = useScanStore(state => state.setScanMode);
  const clearScan = useScanStore(state => state.clearScan);
  const rescan = useScanStore(state => state.rescan);

  // 设置扫码模式
  useEffect(() => {
    setScanMode(mode);

    return () => {
      // 组件卸载时清除扫码模式
      setScanMode(null);
    };
  }, [mode, setScanMode]);

  // 扫码成功后的回调
  useEffect(() => {
    if (currentScan && onScanComplete) {
      onScanComplete(currentScan.barcode);
    }
  }, [currentScan, onScanComplete]);

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className='text-xl sm:text-2xl font-bold'>{title}</h2>

      {/* 扫码结果显示 */}
      {currentScan && (
        <Card className='shadow-sm'>
          <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
            <CardTitle className='text-base sm:text-lg'>扫码结果</CardTitle>
          </CardHeader>
          <CardContent className='px-4 sm:px-6 pb-4'>
            <div className='space-y-2'>
              <div className='text-sm sm:text-base'>
                <span className='font-medium'>条码:</span> {currentScan.barcode}
              </div>
              <div className='text-sm sm:text-base'>
                <span className='font-medium'>类型:</span>{' '}
                {currentScan.type === 'medicine'
                  ? '药品'
                  : currentScan.type === 'batch'
                    ? '批次'
                    : '未知'}
              </div>
              <div className='flex gap-2 mt-3'>
                <Button
                  onClick={clearScan}
                  variant='outline'
                  className='text-sm flex-1 h-10'
                >
                  清除
                </Button>
                <Button onClick={rescan} className='text-sm flex-1 h-10'>
                  重新扫码
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 扫码错误显示 */}
      {scanError && !currentScan && (
        <Alert variant='destructive' className='text-xs sm:text-sm'>
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      )}

      {/* 扫码器 */}
      {(!currentScan || isScanning) && (
        <BarcodeScanner scannerHeight={300} scannerWidth={500} qrbox={250} />
      )}

      {/* 设备状态提示 */}
      {deviceStatus === 'permission-denied' && (
        <Alert className='text-xs sm:text-sm'>
          <AlertDescription>
            摄像头权限被拒绝，请在浏览器设置中允许摄像头访问
          </AlertDescription>
        </Alert>
      )}

      {/* 扫码历史 */}
      <div className='mt-4 pb-16 md:pb-0'>
        <ScanHistory maxItems={5} />
      </div>
    </div>
  );
}
