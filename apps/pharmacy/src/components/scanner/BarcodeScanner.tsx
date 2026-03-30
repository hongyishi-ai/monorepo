import { Html5Qrcode } from 'html5-qrcode';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  createScannedItem,
  parseBarcodeData,
  useScanStore,
  validateBarcode,
} from '@/stores/scan.store';

interface BarcodeScannerProps {
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
  scannerHeight?: number;
  scannerWidth?: number;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
  /** 扫码类型，用于显示不同的提示信息 */
  scanType?: 'medicine' | 'batch' | 'general';
  /** 是否在扫码成功后自动停止 */
  autoStop?: boolean;
  /** 是否自动开始扫码 */
  autoStart?: boolean;
}

/**
 * 条码扫描组件
 * 使用 html5-qrcode 库实现扫码功能
 */
// 摄像头选择组件
const CameraSelector = memo(function CameraSelector({
  cameras,
  cameraId,
  onChange,
  disabled,
}: {
  cameras: Array<{ id: string; label: string }>;
  cameraId: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
}) {
  return (
    <select
      className='w-full p-2 border rounded text-sm'
      value={cameraId}
      onChange={onChange}
      disabled={disabled}
    >
      {cameras.map(camera => (
        <option key={camera.id} value={camera.id}>
          {camera.label || `摄像头 ${camera.id}`}
        </option>
      ))}
    </select>
  );
});

export const BarcodeScanner = memo(function BarcodeScanner({
  onScanSuccess,
  onScanError,
  className = '',
  scannerHeight = 300,
  scannerWidth = 300,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
  scanType = 'general',
  autoStop = true,
  autoStart = false,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanTimeRef = useRef<number>(0); // 存储上次扫码时间
  const [cameraId, setCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    []
  );
  const [isStarted, setIsStarted] = useState(false);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const setScanResult = useScanStore(state => state.setScanResult);
  const setScanError = useScanStore(state => state.setScanError);
  const setDeviceStatus = useScanStore(state => state.setDeviceStatus);
  const { toast } = useToast();

  /**
   * 停止扫码器的通用方法
   */
  const stopScannerSafely = useCallback((scanner: Html5Qrcode) => {
    try {
      if (scanner && typeof scanner.getState === 'function') {
        const state = scanner.getState();
        if (state === 1 || state === 2) {
          // 1: SCANNING, 2: PAUSED
          return scanner.stop();
        }
      } else {
        // 如果没有getState方法，直接尝试停止
        return scanner.stop();
      }
    } catch (error) {
      console.warn('停止扫码器时出现错误:', error);
      return Promise.resolve();
    }
    return Promise.resolve();
  }, []);

  /**
   * 处理扫码成功的回调
   */
  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      // 防止重复扫码同一个条码
      const currentTime = Date.now();
      const lastScanTime = lastScanTimeRef.current;
      if (currentTime - lastScanTime < 2000) {
        return; // 2秒内不允许重复扫码
      }

      // 验证条码格式
      if (!validateBarcode(decodedText)) {
        toast({
          title: '扫码失败',
          description: '条码格式无效',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }

      const trimmedBarcode = decodedText.trim();

      // 记录扫码时间
      lastScanTimeRef.current = currentTime;

      // 扫码成功回调
      if (onScanSuccess) {
        onScanSuccess(trimmedBarcode);
      }

      // 解析条码数据
      const { type, data } = parseBarcodeData(trimmedBarcode);

      // 创建扫码结果并更新状态
      const scannedItem = createScannedItem(trimmedBarcode, type, data);
      setScanResult(scannedItem);

      // 显示成功提示
      const typeLabel =
        type === 'medicine' ? '药品' : type === 'batch' ? '批次' : '未知类型';
      const scanTypeLabel =
        scanType === 'medicine' ? '药品' : scanType === 'batch' ? '批次' : '';

      toast({
        title: '扫码成功',
        description: scanTypeLabel
          ? `已识别${scanTypeLabel}条码: ${trimmedBarcode}`
          : `条码: ${trimmedBarcode} (${typeLabel})`,
        variant: 'success',
        duration: 2000,
      });

      // 根据配置决定是否自动停止扫码器
      if (autoStop) {
        setTimeout(() => {
          if (scannerRef.current && isStarted) {
            stopScannerSafely(scannerRef.current)
              .then(() => {
                setIsStarted(false);
                setDeviceStatus('idle');
              })
              .catch(() => {
                setIsStarted(false);
                setDeviceStatus('idle');
              });
          }
        }, 100);
      }
    },
    [
      onScanSuccess,
      scanType,
      autoStop,
      isStarted,
      toast,
      setScanResult,
      setDeviceStatus,
      stopScannerSafely,
    ]
  );

  /**
   * 开始扫码
   */
  const startScanner = useCallback(() => {
    if (!scannerRef.current || !cameraId) return;

    // 扫码器配置
    const config = {
      fps,
      qrbox: { width: qrbox, height: qrbox },
      aspectRatio,
      disableFlip,
      // 添加摄像头约束，优先使用后置摄像头
      videoConstraints: {
        facingMode: 'environment', // 尝试使用后置摄像头
      },
    };

    setIsStarted(true);
    setDeviceStatus('active');
    setPermissionError(null);

    console.log('启动扫码器，摄像头ID:', cameraId, '配置:', config);

    scannerRef.current
      .start(cameraId, config, handleScanSuccess, errorMessage => {
        // 扫码过程中的错误（非致命错误，如无法识别的条码）
        // 这些错误通常是因为无法识别条码，不需要显示给用户
        if (
          !errorMessage.includes(
            'No MultiFormat Readers were able to detect the code'
          )
        ) {
          console.log('扫码过程错误:', errorMessage);
        }
      })
      .catch(async err => {
        console.error('启动扫码器失败:', err);

        // 如果使用 facingMode 失败，尝试不使用 facingMode 重新启动
        if (
          err.toString().includes('facingMode') ||
          err.toString().includes('constraint')
        ) {
          console.log('尝试不使用 facingMode 重新启动扫码器');

          const fallbackConfig = {
            fps,
            qrbox: { width: qrbox, height: qrbox },
            aspectRatio,
            disableFlip,
          };

          try {
            await scannerRef.current?.start(
              cameraId,
              fallbackConfig,
              handleScanSuccess,
              errorMessage => {
                if (
                  !errorMessage.includes(
                    'No MultiFormat Readers were able to detect the code'
                  )
                ) {
                  console.log('扫码过程错误:', errorMessage);
                }
              }
            );
            console.log('使用备用配置成功启动扫码器');
            return;
          } catch (fallbackErr) {
            console.error('备用配置也失败:', fallbackErr);
          }
        }

        // 启动扫码器失败
        setIsStarted(false);
        setDeviceStatus('error');
        setPermissionError('启动扫码器失败: ' + err.toString());

        if (onScanError) {
          onScanError(err.toString());
        }

        setScanError(err.toString());

        // 显示错误提示
        toast({
          title: '扫码失败',
          description: '启动扫码器失败，请检查摄像头权限',
          variant: 'destructive',
        });
      });
  }, [
    cameraId,
    fps,
    qrbox,
    aspectRatio,
    disableFlip,
    handleScanSuccess,
    onScanError,
    setDeviceStatus,
    setScanError,
    toast,
  ]);

  /**
   * 停止扫码
   */
  const stopScanner = useCallback(() => {
    if (!scannerRef.current || !isStarted) return;

    stopScannerSafely(scannerRef.current)
      .then(() => {
        setIsStarted(false);
        setDeviceStatus('idle');
      })
      .catch(() => {
        setIsStarted(false);
        setDeviceStatus('idle');
      });
  }, [isStarted, setDeviceStatus, stopScannerSafely]);

  /**
   * 切换摄像头
   */
  const switchCamera = useCallback(
    (newCameraId: string) => {
      if (isStarted) {
        stopScanner();
        setCameraId(newCameraId);
        // 短暂延迟后重新启动扫码器
        setTimeout(() => {
          startScanner();
        }, 300);
      } else {
        setCameraId(newCameraId);
      }
    },
    [isStarted, stopScanner, startScanner]
  );

  /**
   * 选择最佳摄像头（优先选择后置摄像头）
   */
  const selectBestCamera = useCallback(
    (devices: Array<{ id: string; label: string }>) => {
      if (!devices || devices.length === 0) return null;

      console.log(
        '可用摄像头设备:',
        devices.map(d => ({ id: d.id, label: d.label }))
      );

      // 后置摄像头识别关键词（更全面的列表）
      const rearCameraKeywords = [
        'back',
        'rear',
        'environment',
        'world',
        'facing back',
        '后置',
        '后摄',
        '后面',
        '环境',
        'main camera',
        'camera2 0',
        'camera 0', // 某些设备的后置摄像头标识
        'wide',
        'primary', // 一些设备将主摄像头标记为wide或primary
      ];

      // 前置摄像头识别关键词
      const frontCameraKeywords = [
        'front',
        'user',
        'facing user',
        'selfie',
        '前置',
        '前摄',
        '前面',
        '用户',
        '自拍',
        'camera2 1',
        'camera 1', // 某些设备的前置摄像头标识
        'facetime', // iOS设备的前置摄像头
      ];

      // 首先尝试找到明确标识为后置的摄像头
      let rearCamera = devices.find(device => {
        const label = device.label.toLowerCase();
        return rearCameraKeywords.some(keyword => label.includes(keyword));
      });

      // 如果没有找到明确的后置摄像头，排除明确的前置摄像头
      if (!rearCamera) {
        rearCamera = devices.find(device => {
          const label = device.label.toLowerCase();
          return !frontCameraKeywords.some(keyword => label.includes(keyword));
        });
      }

      // 如果还是没有找到，使用第一个摄像头
      const selectedCamera = rearCamera || devices[0];

      console.log('选择的摄像头:', {
        id: selectedCamera.id,
        label: selectedCamera.label,
        isRearCamera: !!rearCamera,
        totalDevices: devices.length,
      });

      return selectedCamera;
    },
    []
  );

  // 初始化扫码器
  useEffect(() => {
    const scannerId = 'html5-qrcode-scanner';

    // 确保容器存在
    if (!containerRef.current) return;

    // 创建扫码器实例
    scannerRef.current = new Html5Qrcode(scannerId);

    // 初始化摄像头
    const initializeCamera = async () => {
      try {
        // 首先尝试使用 facingMode 获取后置摄像头
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            // 尝试获取后置摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
            });
            // 立即停止流，我们只是测试权限
            stream.getTracks().forEach(track => track.stop());
            console.log('设备支持 facingMode: environment');
          } catch (facingModeError) {
            console.log(
              '设备可能不支持 facingMode 或没有后置摄像头:',
              facingModeError
            );
          }
        }

        // 获取可用摄像头列表
        const devices = await Html5Qrcode.getCameras();

        if (devices && devices.length > 0) {
          setCameras(devices);

          // 选择最佳摄像头（优先后置摄像头）
          const bestCamera = selectBestCamera(devices);
          if (bestCamera) {
            setCameraId(bestCamera.id);
            console.log(
              '初始化完成，选择摄像头:',
              bestCamera.label || bestCamera.id
            );
          }

          setDeviceStatus('idle');
        } else {
          setPermissionError('未检测到摄像头设备');
          setDeviceStatus('error');
        }
      } catch (err) {
        console.error('初始化摄像头失败:', err);
        setPermissionError('获取摄像头权限失败，请确保已授予摄像头访问权限');
        setDeviceStatus('permission-denied');
      }
    };

    initializeCamera();

    // 组件卸载时停止扫码
    return () => {
      if (scannerRef.current) {
        stopScannerSafely(scannerRef.current).catch(() => {
          // 忽略清理错误
        });
      }
    };
  }, [setDeviceStatus, stopScannerSafely, selectBestCamera]);

  // 自动开始扫码
  useEffect(() => {
    if (autoStart && cameraId && !isStarted && scannerRef.current) {
      // 延迟一点时间确保组件完全初始化
      const timer = setTimeout(() => {
        startScanner();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, cameraId, isStarted, startScanner]);

  // 获取扫码标题
  const getScanTitle = useCallback(() => {
    return scanType === 'medicine'
      ? '扫描药品条码'
      : scanType === 'batch'
        ? '扫描批次条码'
        : '扫码';
  }, [scanType]);

  // 处理开始扫码按钮点击
  const handleStartClick = useCallback(() => {
    startScanner();
  }, [startScanner]);

  // 处理停止扫码按钮点击
  const handleStopClick = useCallback(() => {
    stopScanner();
  }, [stopScanner]);

  // 处理重新扫码按钮点击
  const handleRestartClick = useCallback(() => {
    if (scannerRef.current && isStarted) {
      stopScanner();
      setTimeout(() => {
        startScanner();
      }, 300);
    }
  }, [scannerRef, isStarted, stopScanner, startScanner]);

  // 处理摄像头切换
  const handleCameraChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      switchCamera(e.target.value);
    },
    [switchCamera]
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
        <CardTitle className='text-center text-base sm:text-lg'>
          {getScanTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 sm:px-6'>
        {permissionError ? (
          <Alert variant='destructive' className='mb-4 text-xs sm:text-sm'>
            <AlertDescription>{permissionError}</AlertDescription>
          </Alert>
        ) : null}

        <div
          ref={containerRef}
          className='relative mx-auto'
          style={{
            width: '100%',
            maxWidth: scannerWidth,
            height: scannerHeight,
            overflow: 'hidden',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
          }}
        >
          <div id='html5-qrcode-scanner' className='w-full h-full'></div>

          {!isStarted && !autoStart && (
            <div
              className='absolute inset-0 flex items-center justify-center bg-black/10'
              style={{ backdropFilter: 'blur(2px)' }}
            >
              <Button
                onClick={handleStartClick}
                disabled={!cameraId || cameras.length === 0}
                className='text-sm sm:text-base px-6 py-3 h-auto'
              >
                开始扫码
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className='flex flex-col gap-2 px-4 pb-4 sm:px-6 sm:pb-6'>
        {cameras.length > 1 && (
          <div className='w-full'>
            <CameraSelector
              cameras={cameras}
              cameraId={cameraId}
              onChange={handleCameraChange}
              disabled={cameras.length <= 1}
            />
          </div>
        )}

        <div className='flex justify-between w-full gap-2'>
          {isStarted ? (
            <>
              <Button
                onClick={handleStopClick}
                variant='outline'
                className='flex-1 text-sm h-10 sm:h-11'
              >
                停止扫码
              </Button>
              <Button
                onClick={handleRestartClick}
                variant='secondary'
                className='flex-1 text-sm h-10 sm:h-11'
              >
                重新扫码
              </Button>
            </>
          ) : !autoStart ? (
            <div className='text-center text-sm text-muted-foreground py-2'>
              点击上方按钮开始扫码
            </div>
          ) : (
            <div className='text-center text-sm text-muted-foreground py-2'>
              正在准备扫码...
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
});

export default BarcodeScanner;
