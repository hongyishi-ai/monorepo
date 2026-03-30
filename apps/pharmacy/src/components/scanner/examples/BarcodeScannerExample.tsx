import { useState } from 'react';

import { BarcodeScanner } from '../BarcodeScanner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 条码扫描器使用示例
 * 展示不同场景下的扫码器配置和使用方法
 */
export function BarcodeScannerExample() {
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [scannerType, setScannerType] = useState<
    'medicine' | 'batch' | 'general'
  >('medicine');

  const handleScanSuccess = (barcode: string) => {
    setScannedBarcodes(prev => [barcode, ...prev.slice(0, 9)]); // 保留最近10条记录
  };

  const handleScanError = (error: string) => {
    console.error('扫码错误:', error);
  };

  const clearHistory = () => {
    setScannedBarcodes([]);
  };

  return (
    <div className='space-y-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>条码扫描器示例</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 扫描器类型选择 */}
          <div className='flex gap-2 flex-wrap'>
            <Button
              variant={scannerType === 'medicine' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setScannerType('medicine')}
            >
              药品扫码
            </Button>
            <Button
              variant={scannerType === 'batch' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setScannerType('batch')}
            >
              批次扫码
            </Button>
            <Button
              variant={scannerType === 'general' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setScannerType('general')}
            >
              通用扫码
            </Button>
          </div>

          {/* 扫码器组件 */}
          <div className='max-w-md mx-auto'>
            <BarcodeScanner
              scanType={scannerType}
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              autoStop={true}
              scannerHeight={250}
              scannerWidth={300}
              fps={10}
              qrbox={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* 扫码历史 */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>扫码历史</CardTitle>
          <Button variant='outline' size='sm' onClick={clearHistory}>
            清空历史
          </Button>
        </CardHeader>
        <CardContent>
          {scannedBarcodes.length === 0 ? (
            <p className='text-muted-foreground text-center py-4'>
              暂无扫码记录
            </p>
          ) : (
            <div className='space-y-2'>
              {scannedBarcodes.map((barcode, index) => (
                <div
                  key={`${barcode}-${index}`}
                  className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                >
                  <span className='font-mono text-sm'>{barcode}</span>
                  <Badge variant='secondary'>
                    {scannerType === 'medicine'
                      ? '药品'
                      : scannerType === 'batch'
                        ? '批次'
                        : '通用'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <h4 className='font-medium mb-2'>条码格式要求：</h4>
            <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
              <li>长度：6-20位字符</li>
              <li>字符：仅支持数字和字母</li>
              <li>示例：ABC123456、1234567890</li>
            </ul>
          </div>

          <div>
            <h4 className='font-medium mb-2'>扫码类型：</h4>
            <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
              <li>药品扫码：用于药品入库和查询</li>
              <li>批次扫码：用于批次管理和追溯</li>
              <li>通用扫码：适用于各种条码扫描场景</li>
            </ul>
          </div>

          <div>
            <h4 className='font-medium mb-2'>操作提示：</h4>
            <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
              <li>确保摄像头权限已开启</li>
              <li>将条码对准扫描框中央</li>
              <li>保持适当距离和光线充足</li>
              <li>扫码成功后会自动停止（可配置）</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
