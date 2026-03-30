/**
 * 数据导入导出服务
 * 处理 Excel/CSV 文件的导入和导出功能
 */

import * as XLSX from 'xlsx';

import { TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import type {
  Batch,
  InsertBatch,
  InsertMedicine,
  Medicine,
} from '@/types/database';

// 导入结果类型
export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  importedData?: unknown[];
}

// 导入错误类型
export interface ImportError {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
}

// 导入进度类型
export interface ImportProgress {
  total: number;
  processed: number;
  percentage: number;
  status: 'validating' | 'importing' | 'completed' | 'error';
  currentItem?: string;
}

// 导入类型
export type ImportType = 'medicines' | 'batches' | 'inventory';

// 通用行数据类型 - 用于处理从Excel/CSV导入的未知数据结构
type ImportRowData = Record<string, unknown>;

// 药品导入数据结构
export interface MedicineImportData {
  barcode: string;
  name: string;
  specification: string;
  manufacturer: string;
  shelf_location?: string;
  safety_stock?: number;
}

// 批次导入数据结构
export interface BatchImportData {
  medicine_barcode: string; // 关联药品的条码
  batch_number: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
}

// 数据导入导出服务
export const dataImportExportService = {
  /**
   * 解析 Excel/CSV 文件
   * @param file 上传的文件
   * @returns 解析后的数据
   */
  async parseFile(file: File): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          resolve(jsonData);
        } catch {
          reject(new Error('文件解析失败，请确保文件格式正确'));
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * 验证药品导入数据
   * @param data 导入的数据
   * @returns 验证结果
   */
  validateMedicineData(data: unknown[]): {
    valid: boolean;
    errors: ImportError[];
  } {
    const errors: ImportError[] = [];
    const requiredFields = ['barcode', 'name', 'specification', 'manufacturer'];
    const barcodes = new Set<string>();

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel 行号从 1 开始，加上标题行

      // 类型断言：确保row是一个对象
      const rowData = row as ImportRowData;

      // 检查必填字段
      for (const field of requiredFields) {
        if (!rowData[field]) {
          errors.push({
            row: rowNumber,
            column: field,
            message: `缺少必填字段: ${field}`,
          });
        }
      }

      // 检查条码唯一性
      if (rowData.barcode) {
        const barcode = String(rowData.barcode);
        if (barcodes.has(barcode)) {
          errors.push({
            row: rowNumber,
            column: 'barcode',
            message: `条码重复: ${barcode}`,
            value: barcode,
          });
        } else {
          barcodes.add(barcode);
        }
      }

      // 检查安全库存是否为数字
      if (rowData.safety_stock !== undefined) {
        const safetyStock = Number(rowData.safety_stock);
        if (isNaN(safetyStock) || safetyStock < 0) {
          errors.push({
            row: rowNumber,
            column: 'safety_stock',
            message: '安全库存必须是非负数',
            value: rowData.safety_stock,
          });
        }
      }
    });

    return { valid: errors.length === 0, errors };
  },

  /**
   * 验证批次导入数据
   * @param data 导入的数据
   * @returns 验证结果
   */
  validateBatchData(data: unknown[]): {
    valid: boolean;
    errors: ImportError[];
  } {
    const errors: ImportError[] = [];
    const requiredFields = [
      'medicine_barcode',
      'batch_number',
      'production_date',
      'expiry_date',
      'quantity',
    ];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel 行号从 1 开始，加上标题行

      // 类型断言：确保row是一个对象
      const rowData = row as ImportRowData;

      // 检查必填字段
      for (const field of requiredFields) {
        if (!rowData[field]) {
          errors.push({
            row: rowNumber,
            column: field,
            message: `缺少必填字段: ${field}`,
          });
        }
      }

      // 检查日期格式
      if (rowData.production_date) {
        const productionDate = new Date(String(rowData.production_date));
        if (isNaN(productionDate.getTime())) {
          errors.push({
            row: rowNumber,
            column: 'production_date',
            message: '生产日期格式无效',
            value: rowData.production_date,
          });
        }
      }

      if (rowData.expiry_date) {
        const expiryDate = new Date(String(rowData.expiry_date));
        if (isNaN(expiryDate.getTime())) {
          errors.push({
            row: rowNumber,
            column: 'expiry_date',
            message: '有效期格式无效',
            value: rowData.expiry_date,
          });
        }
      }

      // 检查日期先后顺序
      if (rowData.production_date && rowData.expiry_date) {
        const productionDate = new Date(String(rowData.production_date));
        const expiryDate = new Date(String(rowData.expiry_date));

        if (
          !isNaN(productionDate.getTime()) &&
          !isNaN(expiryDate.getTime()) &&
          productionDate > expiryDate
        ) {
          errors.push({
            row: rowNumber,
            column: 'expiry_date',
            message: '有效期不能早于生产日期',
            value: rowData.expiry_date,
          });
        }
      }

      // 检查数量是否为正数
      if (rowData.quantity !== undefined) {
        const quantity = Number(rowData.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push({
            row: rowNumber,
            column: 'quantity',
            message: '数量必须是正数',
            value: rowData.quantity,
          });
        }
      }
    });

    return { valid: errors.length === 0, errors };
  },

  /**
   * 导入药品数据
   * @param data 药品数据
   * @param onProgress 进度回调
   * @returns 导入结果
   */
  async importMedicines(
    data: MedicineImportData[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: data.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      importedData: [],
    };

    // 验证数据
    onProgress?.({
      total: data.length,
      processed: 0,
      percentage: 0,
      status: 'validating',
    });

    const validation = this.validateMedicineData(data);
    if (!validation.valid) {
      result.errors = validation.errors;
      result.errorCount = validation.errors.length;
      onProgress?.({
        total: data.length,
        processed: 0,
        percentage: 0,
        status: 'error',
      });
      return result;
    }

    // 开始导入
    onProgress?.({
      total: data.length,
      processed: 0,
      percentage: 0,
      status: 'importing',
    });

    const importedData: Medicine[] = [];
    const batchSize = 10; // 每批处理的数据量

    try {
      // 分批处理数据
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const medicineData: InsertMedicine[] = batch.map(item => ({
          barcode: item.barcode,
          name: item.name,
          specification: item.specification,
          manufacturer: item.manufacturer,
          shelf_location: item.shelf_location || null,
          safety_stock:
            item.safety_stock !== undefined ? Number(item.safety_stock) : 0,
        }));

        // 使用 upsert 操作，如果条码已存在则更新
        const { data: insertedData, error } = await supabase
          .from(TABLES.medicines)
          .upsert(medicineData, {
            onConflict: 'barcode',
            ignoreDuplicates: false,
          })
          .select();

        if (error) {
          throw error;
        }

        if (insertedData) {
          importedData.push(...insertedData);
          result.successCount += insertedData.length;
        }

        // 更新进度
        onProgress?.({
          total: data.length,
          processed: i + batch.length,
          percentage: Math.min(
            100,
            Math.round(((i + batch.length) / data.length) * 100)
          ),
          status: 'importing',
          currentItem: `正在处理: ${i + 1} - ${Math.min(i + batch.length, data.length)} / ${data.length}`,
        });
      }

      result.success = true;
      result.importedData = importedData;

      onProgress?.({
        total: data.length,
        processed: data.length,
        percentage: 100,
        status: 'completed',
      });

      return result;
    } catch (error: unknown) {
      console.error('导入药品数据失败:', error);

      result.success = false;
      result.errorCount = data.length - result.successCount;

      // 安全地处理错误消息
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '未知错误';

      result.errors.push({
        row: 0,
        message: `导入失败: ${errorMessage}`,
      });

      onProgress?.({
        total: data.length,
        processed: result.successCount,
        percentage: Math.round((result.successCount / data.length) * 100),
        status: 'error',
      });

      return result;
    }
  },

  /**
   * 导入批次数据
   * @param data 批次数据
   * @param onProgress 进度回调
   * @returns 导入结果
   */
  async importBatches(
    data: BatchImportData[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: data.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      importedData: [],
    };

    // 验证数据
    onProgress?.({
      total: data.length,
      processed: 0,
      percentage: 0,
      status: 'validating',
    });

    const validation = this.validateBatchData(data);
    if (!validation.valid) {
      result.errors = validation.errors;
      result.errorCount = validation.errors.length;
      onProgress?.({
        total: data.length,
        processed: 0,
        percentage: 0,
        status: 'error',
      });
      return result;
    }

    // 开始导入
    onProgress?.({
      total: data.length,
      processed: 0,
      percentage: 0,
      status: 'importing',
    });

    const importedData: Batch[] = [];
    const batchSize = 10; // 每批处理的数据量

    try {
      // 获取所有药品条码和ID的映射
      const { data: medicines, error: medicineError } = await supabase
        .from(TABLES.medicines)
        .select('id, barcode');

      if (medicineError) {
        throw medicineError;
      }

      const barcodeToIdMap = new Map<string, string>();
      medicines?.forEach(medicine => {
        barcodeToIdMap.set(medicine.barcode, medicine.id);
      });

      // 检查所有条码是否存在
      const missingBarcodes = data
        .filter(item => !barcodeToIdMap.has(item.medicine_barcode))
        .map(item => item.medicine_barcode);

      if (missingBarcodes.length > 0) {
        result.success = false;
        result.errorCount = missingBarcodes.length;
        result.errors.push({
          row: 0,
          message: `以下条码对应的药品不存在: ${missingBarcodes.join(', ')}`,
        });

        onProgress?.({
          total: data.length,
          processed: 0,
          percentage: 0,
          status: 'error',
        });

        return result;
      }

      // 分批处理数据
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchData: InsertBatch[] = batch.map(item => ({
          medicine_id: barcodeToIdMap.get(item.medicine_barcode) as string,
          batch_number: item.batch_number,
          production_date: new Date(item.production_date).toISOString(),
          expiry_date: new Date(item.expiry_date).toISOString(),
          quantity: Number(item.quantity),
        }));

        // 使用 upsert 操作，如果批次号已存在则更新
        const { data: insertedData, error } = await supabase
          .from(TABLES.batches)
          .upsert(batchData, {
            onConflict: 'medicine_id,batch_number',
            ignoreDuplicates: false,
          })
          .select();

        if (error) {
          throw error;
        }

        if (insertedData) {
          importedData.push(...insertedData);
          result.successCount += insertedData.length;
        }

        // 更新进度
        onProgress?.({
          total: data.length,
          processed: i + batch.length,
          percentage: Math.min(
            100,
            Math.round(((i + batch.length) / data.length) * 100)
          ),
          status: 'importing',
          currentItem: `正在处理: ${i + 1} - ${Math.min(i + batch.length, data.length)} / ${data.length}`,
        });
      }

      result.success = true;
      result.importedData = importedData;

      onProgress?.({
        total: data.length,
        processed: data.length,
        percentage: 100,
        status: 'completed',
      });

      return result;
    } catch (error: unknown) {
      console.error('导入批次数据失败:', error);

      result.success = false;
      result.errorCount = data.length - result.successCount;

      // 安全地处理错误消息
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '未知错误';

      result.errors.push({
        row: 0,
        message: `导入失败: ${errorMessage}`,
      });

      onProgress?.({
        total: data.length,
        processed: result.successCount,
        percentage: Math.round((result.successCount / data.length) * 100),
        status: 'error',
      });

      return result;
    }
  },

  /**
   * 获取导入模板
   * @param type 导入类型
   * @returns 模板数据
   */
  getImportTemplate(type: ImportType): Record<string, unknown>[] {
    switch (type) {
      case 'medicines':
        return [
          {
            barcode: '6901234567890',
            name: '阿莫西林胶囊',
            specification: '0.25g*24粒',
            manufacturer: '某制药厂',
            shelf_location: 'A-01-1',
            safety_stock: 100,
          },
          {
            barcode: '6901234567891',
            name: '布洛芬片',
            specification: '0.2g*12片',
            manufacturer: '某制药厂',
            shelf_location: 'A-02-3',
            safety_stock: 50,
          },
        ];

      case 'batches':
        return [
          {
            medicine_barcode: '6901234567890',
            batch_number: 'BN20240101',
            production_date: '2024-01-01',
            expiry_date: '2026-01-01',
            quantity: 1000,
          },
          {
            medicine_barcode: '6901234567891',
            batch_number: 'BN20240102',
            production_date: '2024-01-02',
            expiry_date: '2026-01-02',
            quantity: 500,
          },
        ];

      case 'inventory':
        return [
          {
            medicine_barcode: '6901234567890',
            batch_number: 'BN20240101',
            transaction_type: 'inbound',
            quantity: 100,
            transaction_date: '2024-01-15',
            notes: '采购入库',
          },
          {
            medicine_barcode: '6901234567891',
            batch_number: 'BN20240102',
            transaction_type: 'outbound',
            quantity: 20,
            transaction_date: '2024-01-16',
            notes: '门诊出库',
          },
        ];

      default:
        return [];
    }
  },

  /**
   * 导出数据到 Excel
   * @param data 要导出的数据
   * @param fileName 文件名
   * @param sheetName 工作表名
   */
  exportToExcel(
    data: Record<string, unknown>[],
    fileName: string,
    sheetName: string = 'Sheet1'
  ): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 生成 Excel 文件并下载
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * 导出数据到 CSV
   * @param data 要导出的数据
   * @param fileName 文件名
   */
  exportToCSV(data: Record<string, unknown>[], fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // 创建 Blob 对象
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';

    // 添加到文档并触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default dataImportExportService;
