import {
  AlertCircle,
  CheckCircle,
  Download,
  FileWarning,
  RefreshCw,
  Upload,
} from 'lucide-react';
import * as React from 'react';

import { FileUpload } from './FileUpload';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/alert-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDataImport } from '@/hooks/use-data-import-export';
import type {
  ImportResult,
  ImportType,
} from '@/services/data-import-export.service';

interface DataImportProps {
  type: ImportType;
  title?: string;
  description?: string;
  onImportComplete?: (result: ImportResult) => void;
}

/**
 * 数据导入组件
 */
export function DataImport({
  type,
  title = '数据导入',
  description = '上传Excel文件导入数据',
  onImportComplete,
}: DataImportProps) {
  const {
    file,
    progress,
    importResult,
    isImporting,
    error,
    handleFileSelected,
    startImport,
    reset,
    downloadTemplate,
  } = useDataImport(type);

  // 导入类型显示名称
  const typeDisplayName = React.useMemo(() => {
    switch (type) {
      case 'medicines':
        return '药品';
      case 'batches':
        return '批次';
      case 'inventory':
        return '库存';
      default:
        return '数据';
    }
  }, [type]);

  // 处理导入完成
  React.useEffect(() => {
    if (!importResult) return;
    if (importResult.success) {
      toast.success(
        '导入成功',
        `共 ${importResult.successCount}/${importResult.totalRows} 条`
      );
      onImportComplete?.(importResult);
    } else {
      toast.error(
        '导入失败',
        importResult.errors?.[0]?.message || '请检查模板与数据'
      );
    }
  }, [importResult, onImportComplete]);

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* 文件上传区域 */}
        <FileUpload
          onFileSelected={handleFileSelected}
          acceptedFileTypes='.xlsx,.xls,.csv'
          label={`选择${typeDisplayName}数据文件或拖放到此处`}
          buttonText='选择文件'
          error={error || undefined}
          success={
            importResult?.success
              ? `成功导入 ${importResult.successCount} 条${typeDisplayName}数据`
              : undefined
          }
        />

        {/* 导入进度 */}
        {progress && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>导入进度</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress
              value={progress.percentage}
              variant={
                progress.status === 'error'
                  ? 'error'
                  : progress.status === 'completed'
                    ? 'success'
                    : 'default'
              }
            />
            {progress.currentItem && (
              <p className='text-xs text-muted-foreground'>
                {progress.currentItem}
              </p>
            )}
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <Alert variant={importResult.success ? 'success' : 'destructive'}>
            {importResult.success ? (
              <CheckCircle className='h-4 w-4' />
            ) : (
              <AlertCircle className='h-4 w-4' />
            )}
            <AlertTitle>
              {importResult.success ? '导入成功' : '导入失败'}
            </AlertTitle>
            <AlertDescription>
              总计: {importResult.totalRows} 条数据， 成功:{' '}
              {importResult.successCount} 条， 失败: {importResult.errorCount}{' '}
              条
              {importResult.errors.length > 0 && (
                <div className='mt-2'>
                  <details>
                    <summary className='cursor-pointer text-sm font-medium'>
                      查看错误详情 ({importResult.errors.length})
                    </summary>
                    <ul className='mt-2 text-sm list-disc list-inside'>
                      {importResult.errors.map((error, index) => (
                        <li key={index} className='text-xs'>
                          {error.row > 0 ? `行 ${error.row}` : ''}
                          {error.column ? `列 "${error.column}"` : ''}:
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 错误提示 */}
        {error && !importResult && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>导入错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className='flex justify-between'>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => downloadTemplate('xlsx')}
            loading={isImporting}
          >
            <Download className='mr-2 h-4 w-4' />
            下载模板
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => downloadTemplate('csv')}
            loading={isImporting}
          >
            <FileWarning className='mr-2 h-4 w-4' />
            CSV模板
          </Button>
        </div>

        <div className='flex gap-2'>
          {(importResult || error) && (
            <Button
              variant='outline'
              size='sm'
              onClick={reset}
              loading={isImporting}
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              重置
            </Button>
          )}

          <Button
            variant='default'
            size='sm'
            onClick={startImport}
            loading={isImporting || !file}
          >
            {isImporting ? (
              <>
                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                导入中...
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                开始导入
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default DataImport;
