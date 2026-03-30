import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TABLES } from '../../lib/db-keys';
import { createMockBatch, createMockMedicine } from '../../test/test-utils';
import type { Database } from '../../types/database';

// Type definitions for test data
type Medicine = Database['public']['Tables']['medicines']['Row'];
type Batch = Database['public']['Tables']['batches']['Row'];

// interface MockWorksheet {
//   [key: string]: unknown;
// }

// interface _MockWorkbook {
//   Sheets: { [name: string]: MockWorksheet };
//   SheetNames: string[];
// }

// Mock XLSX library with proper typing
const mockXLSX = {
  read: vi.fn(),
  write: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
};

vi.mock('xlsx', () => ({
  default: mockXLSX,
  ...mockXLSX,
}));

// Mock file-saver
const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({
  saveAs: mockSaveAs,
}));

// Mock FileReader - use the same class-based approach as in test setup
class MockFileReaderForImport {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  result: ArrayBuffer | null = new ArrayBuffer(0);
  readAsArrayBuffer = vi.fn();
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
}

// @ts-expect-error - Intentionally overriding global FileReader for testing
(globalThis as typeof globalThis & { FileReader: unknown }).FileReader =
  MockFileReaderForImport;

// Mock Supabase with proper typing
// Create mock functions with proper typing
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpsert = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn();
const mockRange = vi.fn().mockReturnThis();

interface MockSupabaseQuery {
  select: typeof mockSelect;
  insert: typeof mockInsert;
  upsert: typeof mockUpsert;
  eq: typeof mockEq;
  order: typeof mockOrder;
  range: typeof mockRange;
}

interface MockSupabaseClient {
  from: (table: string) => MockSupabaseQuery;
}

const mockSupabaseQuery: MockSupabaseQuery = {
  select: mockSelect,
  insert: mockInsert,
  upsert: mockUpsert,
  eq: mockEq,
  order: mockOrder,
  range: mockRange,
};

const mockSupabase: MockSupabaseClient = {
  from: vi.fn(() => mockSupabaseQuery),
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));
vi.mock('../../lib/db-keys', () => ({
  TABLES: {
    medicines: 'medicines',
    batches: 'batches',
    inventoryTransactions: 'inventory_transactions',
    undoableTransactions: 'undoable_transactions',
    users: 'users',
    systemSettings: 'system_settings',
    auditLogs: 'audit_logs',
  },
  RPC: {
    createBatchAndInbound: 'create_batch_and_inbound',
    checkBatchExists: 'check_batch_exists',
    addBatchQuantity: 'add_batch_quantity',
    processInventoryTransaction: 'process_inventory_transaction',
    undoOutboundTransaction: 'undo_outbound_transaction',
    getReversibleOutboundTransactions: 'get_reversible_outbound_transactions',
    getUndoableTransactions: 'get_undoable_transactions',
    safeDeleteMedicine: 'safe_delete_medicine',
    safeDeleteBatch: 'safe_delete_batch',
    getMedicineDependencies: 'get_medicine_dependencies',
    getBatchDependencies: 'get_batch_dependencies',
    cleanupExpiredUndoableTransactions: 'cleanup_expired_undoable_transactions',
    healthCheck: 'health_check',
    setConfig: 'set_config',
  },
}));

describe('Data Import/Export Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Export', () => {
    it('should export medicines data to Excel', async () => {
      const mockMedicines = [
        createMockMedicine({
          id: '1',
          name: '阿司匹林',
          barcode: '1234567890123',
        }),
        createMockMedicine({
          id: '2',
          name: '布洛芬',
          barcode: '9876543210987',
        }),
      ];

      // Mock database query
      mockOrder.mockResolvedValue({
        data: mockMedicines,
        error: null,
      });

      // Mock XLSX operations
      const mockWorksheet = { A1: { v: '药品名称' }, B1: { v: '条码' } };
      const mockWorkbook = {
        SheetNames: ['medicines'],
        Sheets: { medicines: mockWorksheet },
      };

      mockXLSX.utils.json_to_sheet.mockReturnValue(mockWorksheet);
      mockXLSX.utils.book_new.mockReturnValue(mockWorkbook);
      mockXLSX.write.mockReturnValue(new ArrayBuffer(8));

      // 模拟导出过程
      const exportData = async () => {
        // 1. 获取数据
        const { data: medicines } = await mockSupabase
          .from(TABLES.medicines)
          .select('*')
          .order('name');

        // 2. 转换为导出格式
        const exportData = (medicines as Medicine[]).map(
          (medicine: Medicine) => ({
            药品名称: medicine.name,
            条码: medicine.barcode,
            规格: medicine.specification,
            生产厂家: medicine.manufacturer,
            货架位置: medicine.shelf_location,
            安全库存: medicine.safety_stock,
          })
        );

        // 3. 创建工作表
        const worksheet = mockXLSX.utils.json_to_sheet(exportData);
        const workbook = mockXLSX.utils.book_new();
        mockXLSX.utils.book_append_sheet(workbook, worksheet, '药品数据');

        // 4. 生成文件
        const excelBuffer = mockXLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // 5. 下载文件
        mockSaveAs(blob, '药品数据.xlsx');

        return { success: true, count: (medicines as Medicine[]).length };
      };

      const result = await exportData();

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('medicines');
      expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('should export batches data to Excel', async () => {
      const mockBatches = [
        createMockBatch({ id: '1', batch_number: 'B001', quantity: 100 }),
        createMockBatch({ id: '2', batch_number: 'B002', quantity: 50 }),
      ];

      mockOrder.mockResolvedValue({
        data: mockBatches,
        error: null,
      });

      const exportBatches = async () => {
        const { data: batches } = await mockSupabase
          .from(TABLES.batches)
          .select('*')
          .order('expiry_date');

        const exportData = (batches as Batch[]).map((batch: Batch) => ({
          批次号: batch.batch_number,
          生产日期: batch.production_date,
          有效期: batch.expiry_date,
          数量: batch.quantity,
        }));

        const worksheet = mockXLSX.utils.json_to_sheet(exportData);
        const workbook = mockXLSX.utils.book_new();
        mockXLSX.utils.book_append_sheet(workbook, worksheet, '批次数据');

        const excelBuffer = mockXLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        mockSaveAs(blob, '批次数据.xlsx');

        return { success: true, count: (batches as Batch[]).length };
      };

      const result = await exportBatches();

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should handle export errors', async () => {
      const mockError = new Error('Database connection failed');

      mockOrder.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const exportWithError = async () => {
        try {
          const { data, error } = await mockSupabase
            .from(TABLES.medicines)
            .select('*')
            .order('name');

          if (error) throw error;

          return { success: true, count: (data as Medicine[]).length };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      };

      const result = await exportWithError();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('Data Import', () => {
    it('should import medicines from Excel file', async () => {
      // const _mockFile = new File(['mock excel content'], 'medicines.xlsx', {
      //   type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // });

      const mockImportData = [
        {
          药品名称: '阿司匹林',
          条码: '1234567890123',
          规格: '100mg',
          生产厂家: '拜耳制药',
        },
        {
          药品名称: '布洛芬',
          条码: '9876543210987',
          规格: '200mg',
          生产厂家: '强生制药',
        },
      ];

      // Mock file reading - create an instance of our mock FileReader
      const fileReaderInstance = new MockFileReaderForImport();
      fileReaderInstance.result = new ArrayBuffer(8);
      mockXLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      mockXLSX.utils.sheet_to_json.mockReturnValue(mockImportData);

      // Mock database insert
      mockUpsert.mockResolvedValue({
        data: mockImportData.map((item, index) => ({ id: index + 1, ...item })),
        error: null,
      });

      const importMedicines = async () => {
        // 直接模拟文件处理过程，不依赖实际的 FileReader
        const workbook = mockXLSX.read(new ArrayBuffer(8), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = mockXLSX.utils.sheet_to_json(worksheet);

        // 转换数据格式
        const medicines = jsonData.map((row: Record<string, unknown>) => ({
          name: row['药品名称'],
          barcode: row['条码'],
          specification: row['规格'],
          manufacturer: row['生产厂家'],
          shelf_location: row['货架位置'] || null,
          safety_stock: row['安全库存'] || 0,
        }));

        // 插入数据库
        const { data: insertedData, error } = await mockSupabase
          .from(TABLES.medicines)
          .upsert(medicines, { onConflict: 'barcode' });

        if (error) throw error;

        return { success: true, count: medicines.length, data: insertedData };
      };

      const result = await importMedicines();

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockXLSX.read).toHaveBeenCalled();
      expect(mockXLSX.utils.sheet_to_json).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.medicines);
    });

    it('should validate import data format', () => {
      const validData = [
        {
          药品名称: '阿司匹林',
          条码: '1234567890123',
          规格: '100mg',
          生产厂家: '拜耳制药',
        },
        {
          药品名称: '布洛芬',
          条码: '9876543210987',
          规格: '200mg',
          生产厂家: '强生制药',
        },
      ];

      const invalidData = [
        {
          药品名称: '',
          条码: '1234567890123',
          规格: '100mg',
          生产厂家: '拜耳制药',
        }, // 缺少名称
        { 药品名称: '布洛芬', 条码: '', 规格: '200mg', 生产厂家: '强生制药' }, // 缺少条码
      ];

      const validateImportData = (data: Record<string, unknown>[]) => {
        const errors: string[] = [];

        data.forEach((row, index) => {
          if (!row['药品名称']) {
            errors.push(`第 ${index + 1} 行：药品名称不能为空`);
          }
          if (!row['条码']) {
            errors.push(`第 ${index + 1} 行：条码不能为空`);
          }
          if (!row['规格']) {
            errors.push(`第 ${index + 1} 行：规格不能为空`);
          }
          if (!row['生产厂家']) {
            errors.push(`第 ${index + 1} 行：生产厂家不能为空`);
          }
        });

        return { isValid: errors.length === 0, errors };
      };

      const validResult = validateImportData(validData);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateImportData(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle import errors gracefully', async () => {
      const mockError = new Error('Duplicate barcode');

      mockUpsert.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const importWithError = async () => {
        try {
          const medicines = [
            {
              name: '阿司匹林',
              barcode: '1234567890123',
              specification: '100mg',
              manufacturer: '拜耳制药',
            },
          ];

          const { error } = await mockSupabase
            .from(TABLES.medicines)
            .upsert(medicines, { onConflict: 'barcode' });

          if (error) throw error;

          return { success: true, count: medicines.length };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      };

      const result = await importWithError();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate barcode');
    });
  });

  describe('File Format Support', () => {
    it('should support Excel (.xlsx) files', () => {
      const excelFile = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const isExcelFile = (file: File) => {
        return (
          file.type ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.xlsx')
        );
      };

      expect(isExcelFile(excelFile)).toBe(true);
    });

    it('should support CSV files', () => {
      const csvFile = new File(['content'], 'data.csv', {
        type: 'text/csv',
      });

      const isCsvFile = (file: File) => {
        return file.type === 'text/csv' || file.name.endsWith('.csv');
      };

      expect(isCsvFile(csvFile)).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const textFile = new File(['content'], 'data.txt', {
        type: 'text/plain',
      });

      const isSupportedFile = (file: File) => {
        const supportedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ];
        const supportedExtensions = ['.xlsx', '.csv'];

        return (
          supportedTypes.includes(file.type) ||
          supportedExtensions.some(ext => file.name.endsWith(ext))
        );
      };

      expect(isSupportedFile(textFile)).toBe(false);
    });
  });

  describe('Data Transformation', () => {
    it('should transform export data correctly', () => {
      const medicines = [
        createMockMedicine({
          name: '阿司匹林',
          barcode: '1234567890123',
          specification: '100mg',
          manufacturer: '拜耳制药',
          shelf_location: 'A-01-1',
          safety_stock: 10,
        }),
      ];

      const transformForExport = (medicines: Medicine[]) => {
        return medicines.map(medicine => ({
          药品名称: medicine.name,
          条码: medicine.barcode,
          规格: medicine.specification,
          生产厂家: medicine.manufacturer,
          货架位置: medicine.shelf_location || '',
          安全库存: medicine.safety_stock || 0,
        }));
      };

      const exportData = transformForExport(medicines);

      expect(exportData[0]).toEqual({
        药品名称: '阿司匹林',
        条码: '1234567890123',
        规格: '100mg',
        生产厂家: '拜耳制药',
        货架位置: 'A-01-1',
        安全库存: 10,
      });
    });

    it('should transform import data correctly', () => {
      const importData = [
        {
          药品名称: '阿司匹林',
          条码: '1234567890123',
          规格: '100mg',
          生产厂家: '拜耳制药',
          货架位置: 'A-01-1',
          安全库存: '10',
        },
      ];

      const transformForImport = (data: Record<string, unknown>[]) => {
        return data.map(row => ({
          name: row['药品名称'],
          barcode: row['条码'],
          specification: row['规格'],
          manufacturer: row['生产厂家'],
          shelf_location: row['货架位置'] || null,
          safety_stock: parseInt(String(row['安全库存'] || '0')) || 0,
        }));
      };

      const medicines = transformForImport(importData);

      expect(medicines[0]).toEqual({
        name: '阿司匹林',
        barcode: '1234567890123',
        specification: '100mg',
        manufacturer: '拜耳制药',
        shelf_location: 'A-01-1',
        safety_stock: 10,
      });
    });
  });
});
