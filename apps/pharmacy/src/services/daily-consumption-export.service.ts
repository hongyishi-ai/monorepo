/**
 * 日消耗报表导出服务
 * 提供Excel和PDF导出功能
 */

import * as XLSX from 'xlsx';

export type MedicineCategory = 'internal' | 'external' | 'injection';

export interface CategorizedMedicine {
  category: MedicineCategory;
  categoryName: string;
  medicineId: string;
  medicineName: string;
  specification?: string;
  manufacturer?: string;
  barcode: string;
  totalConsumption: number;
  batchCount: number;
}

export interface DailyConsumptionReportData {
  date: string;
  reportNumber: string;
  filledBy: string;
  categories: {
    internal: CategorizedMedicine[];
    external: CategorizedMedicine[];
    injection: CategorizedMedicine[];
  };
  totals: {
    internal: number;
    external: number;
    injection: number;
    overall: number;
  };
}

// 时间范围报表数据类型
export interface DateRangeReportData
  extends Omit<DailyConsumptionReportData, 'date' | 'reportNumber'> {
  startDate: string;
  endDate: string;
  reportNumber: string;
}

/**
 * 日消耗报表导出服务
 */
export const dailyConsumptionExportService = {
  /**
   * 导出为Excel格式
   */
  exportToExcel(data: DailyConsumptionReportData): void {
    const workbook = XLSX.utils.book_new();

    // 创建主工作表
    const mainSheet = this.createMainSheet(data);
    XLSX.utils.book_append_sheet(workbook, mainSheet, '日消耗报表');

    // 创建详细数据工作表
    const detailSheet = this.createDetailSheet(data);
    XLSX.utils.book_append_sheet(workbook, detailSheet, '详细数据');

    // 生成文件名
    const fileName = `药房处方统计表_${data.date.replace(/-/g, '')}`;

    // 下载文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * 导出时间范围报表为Excel格式
   */
  exportDateRangeToExcel(data: DateRangeReportData): void {
    const workbook = XLSX.utils.book_new();

    // 创建主工作表
    const mainSheet = this.createDateRangeMainSheet(data);
    XLSX.utils.book_append_sheet(workbook, mainSheet, '消耗统计报表');

    // 创建详细数据工作表
    const detailSheet = this.createDateRangeDetailSheet(data);
    XLSX.utils.book_append_sheet(workbook, detailSheet, '详细数据');

    // 生成文件名
    const fileName = `药房消耗统计表_${data.startDate.replace(/-/g, '')}_${data.endDate.replace(/-/g, '')}`;

    // 下载文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * 创建主报表工作表
   */
  createMainSheet(data: DailyConsumptionReportData): XLSX.WorkSheet {
    const sheetData: (string | number)[][] = [];

    // 标题行
    sheetData.push([
      `${new Date(data.date).getFullYear()}年`,
      '',
      '',
      '',
      `数量：${data.totals.overall}`,
    ]);
    sheetData.push(['']);
    sheetData.push(['', '', '药房处方统计表', '', '']);
    sheetData.push(['']);
    sheetData.push([
      `填写人：${data.filledBy}`,
      '',
      '',
      '',
      `时间：${new Date(data.date).getMonth() + 1}月${new Date(data.date).getDate()}日`,
    ]);
    sheetData.push(['']);

    // 表头
    sheetData.push([
      '内服',
      '',
      '',
      '',
      '外用',
      '',
      '',
      '',
      '针剂',
      '',
      '',
      '',
    ]);
    sheetData.push([
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
    ]);

    // 数据行
    const maxRows = Math.max(
      data.categories.internal.length,
      data.categories.external.length,
      data.categories.injection.length,
      10 // 最少10行
    );

    for (let i = 0; i < maxRows; i++) {
      const row: (string | number)[] = [];

      // 内服药数据
      const internalMed = data.categories.internal[i];
      if (internalMed) {
        row.push(
          '内服',
          internalMed.medicineName,
          internalMed.specification || '',
          internalMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.internal : '');
      } else {
        row.push('', '', '', '', '');
      }

      // 外用药数据
      const externalMed = data.categories.external[i];
      if (externalMed) {
        row.push(
          '外用',
          externalMed.medicineName,
          externalMed.specification || '',
          externalMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.external : '');
      } else {
        row.push('', '', '', '', '');
      }

      // 针剂数据
      const injectionMed = data.categories.injection[i];
      if (injectionMed) {
        row.push(
          '针剂',
          injectionMed.medicineName,
          injectionMed.specification || '',
          injectionMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.injection : '');
      } else {
        row.push('', '', '', '', '');
      }

      sheetData.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 8 }, // 类别
      { width: 20 }, // 品名
      { width: 15 }, // 规格
      { width: 8 }, // 数量
      { width: 8 }, // 合计
      { width: 8 }, // 类别
      { width: 20 }, // 品名
      { width: 15 }, // 规格
      { width: 8 }, // 数量
      { width: 8 }, // 合计
      { width: 8 }, // 类别
      { width: 20 }, // 品名
      { width: 15 }, // 规格
      { width: 8 }, // 数量
      { width: 8 }, // 合计
    ];

    return worksheet;
  },

  /**
   * 创建时间范围报表主工作表
   */
  createDateRangeMainSheet(data: DateRangeReportData): XLSX.WorkSheet {
    const sheetData: (string | number)[][] = [];

    // 标题行
    sheetData.push([
      `${new Date(data.startDate).getFullYear()}年`,
      '',
      '',
      '',
      `数量：${data.totals.overall}`,
    ]);
    sheetData.push(['']);
    sheetData.push(['', '', '药房消耗统计表', '', '']);
    sheetData.push(['']);
    sheetData.push([
      `填写人：${data.filledBy}`,
      '',
      '',
      '',
      `时间：${data.startDate} 至 ${data.endDate}`,
    ]);
    sheetData.push(['']);

    // 表头
    sheetData.push([
      '内服',
      '',
      '',
      '',
      '外用',
      '',
      '',
      '',
      '针剂',
      '',
      '',
      '',
    ]);
    sheetData.push([
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
      '类别',
      '品名',
      '规格',
      '数量',
      '合计',
    ]);

    // 数据行
    const maxRows = Math.max(
      data.categories.internal.length,
      data.categories.external.length,
      data.categories.injection.length,
      10 // 最少10行
    );

    for (let i = 0; i < maxRows; i++) {
      const row: (string | number)[] = [];

      // 内服药数据
      const internalMed = data.categories.internal[i];
      if (internalMed) {
        row.push(
          '内服',
          internalMed.medicineName,
          internalMed.specification || '',
          internalMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.internal : '');
      } else {
        row.push('', '', '', '', '');
      }

      // 外用药数据
      const externalMed = data.categories.external[i];
      if (externalMed) {
        row.push(
          '外用',
          externalMed.medicineName,
          externalMed.specification || '',
          externalMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.external : '');
      } else {
        row.push('', '', '', '', '');
      }

      // 针剂数据
      const injectionMed = data.categories.injection[i];
      if (injectionMed) {
        row.push(
          '针剂',
          injectionMed.medicineName,
          injectionMed.specification || '',
          injectionMed.totalConsumption
        );
        row.push(i === 0 ? data.totals.injection : '');
      } else {
        row.push('', '', '', '', '');
      }

      sheetData.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 8 }, // 类别
      { wch: 20 }, // 品名
      { wch: 15 }, // 规格
      { wch: 8 }, // 数量
      { wch: 8 }, // 合计
      { wch: 8 }, // 类别
      { wch: 20 }, // 品名
      { wch: 15 }, // 规格
      { wch: 8 }, // 数量
      { wch: 8 }, // 合计
      { wch: 8 }, // 类别
      { wch: 20 }, // 品名
      { wch: 15 }, // 规格
      { wch: 8 }, // 数量
      { wch: 8 }, // 合计
    ];

    return worksheet;
  },

  /**
   * 创建详细数据工作表
   */
  createDetailSheet(data: DailyConsumptionReportData): XLSX.WorkSheet {
    const detailData: Record<string, unknown>[] = [];

    // 合并所有分类的数据
    const allMedicines = [
      ...data.categories.internal,
      ...data.categories.external,
      ...data.categories.injection,
    ];

    allMedicines.forEach(medicine => {
      detailData.push({
        日期: data.date,
        类别: medicine.categoryName,
        药品名称: medicine.medicineName,
        规格: medicine.specification || '',
        生产厂家: medicine.manufacturer || '',
        条码: medicine.barcode,
        消耗数量: medicine.totalConsumption,
        批次数: medicine.batchCount,
      });
    });

    // 添加汇总行
    detailData.push({
      日期: data.date,
      类别: '汇总',
      药品名称: '总计',
      规格: '',
      生产厂家: '',
      条码: '',
      消耗数量: data.totals.overall,
      批次数: '',
    });

    return XLSX.utils.json_to_sheet(detailData);
  },

  /**
   * 创建时间范围报表详细数据工作表
   */
  createDateRangeDetailSheet(data: DateRangeReportData): XLSX.WorkSheet {
    const detailData: Record<string, unknown>[] = [];

    // 合并所有分类的数据
    const allMedicines = [
      ...data.categories.internal,
      ...data.categories.external,
      ...data.categories.injection,
    ];

    allMedicines.forEach(medicine => {
      detailData.push({
        时间范围: `${data.startDate} 至 ${data.endDate}`,
        类别: medicine.categoryName,
        药品名称: medicine.medicineName,
        规格: medicine.specification || '',
        生产厂家: medicine.manufacturer || '',
        条码: medicine.barcode,
        消耗数量: medicine.totalConsumption,
        批次数: medicine.batchCount,
      });
    });

    // 添加汇总行
    detailData.push({
      时间范围: `${data.startDate} 至 ${data.endDate}`,
      类别: '汇总',
      药品名称: '总计',
      规格: '',
      生产厂家: '',
      条码: '',
      消耗数量: data.totals.overall,
      批次数: '',
    });

    return XLSX.utils.json_to_sheet(detailData);
  },

  /**
   * 导出为PDF格式（使用浏览器打印功能）
   */
  exportToPDF(): void {
    // 隐藏不需要打印的元素
    const printStyle = document.createElement('style');
    printStyle.textContent = `
      @media print {
        .print\\:hidden { display: none !important; }
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        @page { margin: 1cm; size: A4; }
      }
    `;
    document.head.appendChild(printStyle);

    // 触发打印
    window.print();

    // 清理样式
    setTimeout(() => {
      document.head.removeChild(printStyle);
    }, 1000);
  },

  /**
   * 生成CSV格式数据
   */
  exportToCSV(data: DailyConsumptionReportData): void {
    const csvData: string[][] = [];

    // 标题
    csvData.push([`药房处方统计表 - ${data.date}`]);
    csvData.push([
      `填写人：${data.filledBy}`,
      `总数量：${data.totals.overall}`,
    ]);
    csvData.push(['']);

    // 表头
    csvData.push([
      '类别',
      '药品名称',
      '规格',
      '生产厂家',
      '条码',
      '消耗数量',
      '批次数',
    ]);

    // 数据
    const allMedicines = [
      ...data.categories.internal,
      ...data.categories.external,
      ...data.categories.injection,
    ];

    allMedicines.forEach(medicine => {
      csvData.push([
        medicine.categoryName,
        medicine.medicineName,
        medicine.specification || '',
        medicine.manufacturer || '',
        medicine.barcode,
        medicine.totalConsumption.toString(),
        medicine.batchCount.toString(),
      ]);
    });

    // 汇总
    csvData.push(['']);
    csvData.push(['分类汇总']);
    csvData.push(['内服', data.totals.internal.toString()]);
    csvData.push(['外用', data.totals.external.toString()]);
    csvData.push(['针剂', data.totals.injection.toString()]);
    csvData.push(['总计', data.totals.overall.toString()]);

    // 转换为CSV字符串
    const csvContent = csvData
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // 添加BOM以支持中文
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `药房处方统计表_${data.date.replace(/-/g, '')}.csv`
    );
    link.style.visibility = 'hidden';

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * 导出时间范围报表为CSV格式
   */
  exportDateRangeToCSV(data: DateRangeReportData): void {
    const csvData: string[][] = [];

    // 标题
    csvData.push([`药房消耗统计表 - ${data.startDate} 至 ${data.endDate}`]);
    csvData.push([
      `填写人：${data.filledBy}`,
      `总数量：${data.totals.overall}`,
    ]);
    csvData.push(['']);

    // 表头
    csvData.push([
      '类别',
      '药品名称',
      '规格',
      '生产厂家',
      '条码',
      '消耗数量',
      '批次数',
    ]);

    // 数据
    const allMedicines = [
      ...data.categories.internal,
      ...data.categories.external,
      ...data.categories.injection,
    ];

    allMedicines.forEach(medicine => {
      csvData.push([
        medicine.categoryName,
        medicine.medicineName,
        medicine.specification || '',
        medicine.manufacturer || '',
        medicine.barcode,
        medicine.totalConsumption.toString(),
        medicine.batchCount.toString(),
      ]);
    });

    // 汇总
    csvData.push(['']);
    csvData.push(['分类汇总']);
    csvData.push(['内服', data.totals.internal.toString()]);
    csvData.push(['外用', data.totals.external.toString()]);
    csvData.push(['针剂', data.totals.injection.toString()]);
    csvData.push(['总计', data.totals.overall.toString()]);

    // 转换为CSV字符串
    const csvContent = csvData
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // 添加BOM以支持中文
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `药房消耗统计表_${data.startDate.replace(/-/g, '')}_${data.endDate.replace(/-/g, '')}.csv`
    );
    link.style.visibility = 'hidden';

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default dailyConsumptionExportService;
