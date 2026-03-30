/**
 * 数据导入导出相关 hooks
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { handleQuerySuccess } from '@/lib/query-client';
import type {
  BatchImportData,
  ImportProgress,
  ImportResult,
  ImportType,
  MedicineImportData,
} from '@/services/data-import-export.service';
import { dataImportExportService } from '@/services/data-import-export.service';
import { useNotificationStore } from '@/stores/notification.store';

// 导入数据 hook
export const useDataImport = (type: ImportType) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useNotificationStore(state => state.addNotification);

  // 处理文件选择
  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setImportResult(null);
    setProgress(null);
  }, []);

  // 处理进度更新
  const handleProgressUpdate = useCallback((progress: ImportProgress) => {
    setProgress(progress);

    if (progress.status === 'error') {
      setIsImporting(false);
    } else if (progress.status === 'completed') {
      setIsImporting(false);
    }
  }, []);

  // 导入数据 mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error('请先选择文件');
      }

      setIsImporting(true);
      setError(null);
      setImportResult(null);

      try {
        // 解析文件
        const parsedData = await dataImportExportService.parseFile(file);

        if (parsedData.length === 0) {
          throw new Error('文件中没有数据');
        }

        // 根据类型导入数据
        let result: ImportResult;

        switch (type) {
          case 'medicines':
            // Type assertion with validation - parsedData should be MedicineImportData[]
            result = await dataImportExportService.importMedicines(
              parsedData as MedicineImportData[],
              handleProgressUpdate
            );
            break;
          case 'batches':
            // Type assertion with validation - parsedData should be BatchImportData[]
            result = await dataImportExportService.importBatches(
              parsedData as BatchImportData[],
              handleProgressUpdate
            );
            break;
          default:
            throw new Error('不支持的导入类型');
        }

        setImportResult(result);

        if (result.success) {
          handleQuerySuccess(
            `成功导入 ${result.successCount} 条数据`,
            '导入成功'
          );
        } else {
          setError(`导入失败: ${result.errors.map(e => e.message).join('; ')}`);

          addNotification({
            type: 'error',
            title: '导入失败',
            message: `导入过程中发生错误，成功导入 ${result.successCount} 条，失败 ${result.errorCount} 条`,
            priority: 'high',
          });
        }

        return result;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '导入失败');
        setIsImporting(false);
        throw err;
      }
    },
  });

  // 开始导入
  const startImport = useCallback(() => {
    if (!file) {
      setError('请先选择文件');
      return;
    }

    importMutation.mutate();
  }, [file, importMutation]);

  // 重置状态
  const reset = useCallback(() => {
    setFile(null);
    setProgress(null);
    setImportResult(null);
    setIsImporting(false);
    setError(null);
  }, []);

  // 下载导入模板
  const downloadTemplate = useCallback(
    (format: 'xlsx' | 'csv' = 'xlsx') => {
      const templateData = dataImportExportService.getImportTemplate(type);
      const fileName = `${type}_template`;

      if (format === 'xlsx') {
        dataImportExportService.exportToExcel(
          templateData,
          fileName,
          `${type}模板`
        );
      } else {
        dataImportExportService.exportToCSV(templateData, fileName);
      }

      handleQuerySuccess('模板下载成功', '下载成功');
    },
    [type]
  );

  return {
    file,
    progress,
    importResult,
    isImporting,
    error,
    handleFileSelected,
    startImport,
    reset,
    downloadTemplate,
  };
};

// 导出数据 hook
export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 导出到 Excel
  const exportToExcel = useCallback(
    async (data: unknown[], fileName: string, sheetName?: string) => {
      try {
        setIsExporting(true);
        setError(null);

        dataImportExportService.exportToExcel(
          data as Record<string, unknown>[],
          fileName,
          sheetName
        );

        handleQuerySuccess('数据导出成功', '导出成功');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '导出失败');
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  // 导出到 CSV
  const exportToCSV = useCallback(async (data: unknown[], fileName: string) => {
    try {
      setIsExporting(true);
      setError(null);

      dataImportExportService.exportToCSV(
        data as Record<string, unknown>[],
        fileName
      );

      handleQuerySuccess('数据导出成功', '导出成功');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportToExcel,
    exportToCSV,
  };
};

export default { useDataImport, useDataExport };
