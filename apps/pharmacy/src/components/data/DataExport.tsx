import { AlertCircle, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as React from 'react';

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
import { useDataExport } from '@/hooks/use-data-import-export';

interface DataExportProps {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  fileName: string;
  sheetName?: string;
  exportDisabled?: boolean;
  showPreview?: boolean;
  previewLimit?: number;
}

/**
 * 数据导出组件
 */
export function DataExport({
  title = '数据导出',
  description = '导出数据到Excel或CSV文件',
  data,
  fileName,
  sheetName,
  exportDisabled = false,
  showPreview = true,
  previewLimit = 5,
}: DataExportProps) {
  const { isExporting, error, exportToExcel, exportToCSV } = useDataExport();

  React.useEffect(() => {
    if (!error) return;
    toast.error('导出失败', error);
  }, [error]);

  // 预览数据
  const previewData = React.useMemo(() => {
    if (!showPreview || !data || data.length === 0) return [];
    return data.slice(0, previewLimit);
  }, [data, showPreview, previewLimit]);

  // 获取数据列名
  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* 数据统计 */}
        <div className='flex items-center justify-between text-sm'>
          <span>数据总数: {data.length} 条</span>
          <span>列数: {columns.length}</span>
        </div>

        {/* 数据预览 */}
        {showPreview && previewData.length > 0 && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>
              数据预览 (前 {Math.min(previewLimit, data.length)} 条)
            </h4>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr className='bg-muted'>
                    {columns.map(column => (
                      <th
                        key={column}
                        className='p-2 text-left border border-border'
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      }
                    >
                      {columns.map(column => (
                        <td
                          key={`${rowIndex}-${column}`}
                          className='p-2 border border-border'
                        >
                          {row[column]?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > previewLimit && (
              <p className='text-xs text-muted-foreground'>
                显示前 {previewLimit} 条，共 {data.length} 条数据
              </p>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>导出错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 空数据提示 */}
        {(!data || data.length === 0) && (
          <Alert variant='warning'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>无数据可导出</AlertTitle>
            <AlertDescription>当前没有可导出的数据</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className='flex justify-end gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => exportToCSV(data, fileName)}
          loading={isExporting || exportDisabled || !data || data.length === 0}
        >
          <FileText className='mr-2 h-4 w-4' />
          导出CSV
        </Button>

        <Button
          variant='default'
          size='sm'
          onClick={() => exportToExcel(data, fileName, sheetName)}
          loading={isExporting || exportDisabled || !data || data.length === 0}
        >
          {isExporting ? (
            <>
              <FileDown className='mr-2 h-4 w-4 animate-bounce' />
              导出中...
            </>
          ) : (
            <>
              <FileSpreadsheet className='mr-2 h-4 w-4' />
              导出Excel
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default DataExport;
