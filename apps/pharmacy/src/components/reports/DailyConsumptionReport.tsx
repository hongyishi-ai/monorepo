/**
 * 日消耗报表组件
 * 生成药房处方统计表格式的日消耗报表
 */

import { Download, FileText, Printer } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDailyConsumption } from '@/hooks/use-consumption-stats';
import { cn } from '@/lib/utils';
import {
  type CategorizedMedicine,
  type DailyConsumptionReportData,
} from '@/services/daily-consumption-export.service';

interface DailyConsumptionReportProps {
  date?: string;
  filledBy?: string;
  onExportExcel?: (data: DailyConsumptionReportData) => void;
  onExportPDF?: (data: DailyConsumptionReportData) => void;
  className?: string;
}

/**
 * 日消耗报表组件
 */
export function DailyConsumptionReport({
  date = new Date().toISOString().split('T')[0],
  filledBy = '',
  onExportExcel,
  onExportPDF,
  className,
}: DailyConsumptionReportProps) {
  // 获取当日消耗数据
  const { data: dailyConsumption, isLoading } = useDailyConsumption({
    startDate: date,
    endDate: date,
    limit: 1000,
  });

  // 生成报表数据
  const reportData = useMemo(() => {
    if (!dailyConsumption?.length) return null;

    // 获取分类名称
    const getCategoryName = (category: string) => {
      const categoryNames = {
        internal: '内服',
        external: '外用',
        injection: '针剂',
      };
      return categoryNames[category as keyof typeof categoryNames] || '内服';
    };

    // 分类消耗数据
    const categorized = {
      internal: [] as CategorizedMedicine[],
      external: [] as CategorizedMedicine[],
      injection: [] as CategorizedMedicine[],
    };

    dailyConsumption.forEach(item => {
      const category = item.category || 'internal'; // 使用数据库中的分类，默认为内服
      const categorizedItem = {
        category,
        categoryName: getCategoryName(category),
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        specification: item.specification,
        manufacturer: item.manufacturer,
        barcode: item.barcode,
        totalConsumption: item.totalOutbound,
        batchCount: item.batchCount,
      };
      categorized[category as keyof typeof categorized].push(categorizedItem);
    });

    // 计算各类别总计
    const totals = {
      internal: categorized.internal.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      external: categorized.external.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      injection: categorized.injection.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      overall: 0,
    };
    totals.overall = totals.internal + totals.external + totals.injection;

    // 生成报表编号
    const reportNumber = `RPT${(date || new Date().toISOString().split('T')[0]).replace(/-/g, '')}`;

    return {
      date: date || new Date().toISOString().split('T')[0],
      reportNumber,
      filledBy: filledBy || '系统管理员',
      categories: categorized,
      totals,
    };
  }, [dailyConsumption, date, filledBy]);

  // 处理导出
  const handleExportExcel = () => {
    if (reportData && onExportExcel) {
      onExportExcel(reportData);
    }
  };

  const handleExportPDF = () => {
    if (reportData && onExportPDF) {
      onExportPDF(reportData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='text-center text-muted-foreground'>
            正在加载报表数据...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='text-center text-muted-foreground'>
            {date} 暂无消耗数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 操作按钮 */}
      <Card className='print:hidden'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              日消耗报表
            </CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePrint}
                className='flex items-center gap-2'
              >
                <Printer className='h-4 w-4' />
                打印
              </Button>
              {onExportExcel && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportExcel}
                  className='flex items-center gap-2'
                >
                  <Download className='h-4 w-4' />
                  导出Excel
                </Button>
              )}
              {onExportPDF && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportPDF}
                  className='flex items-center gap-2'
                >
                  <Download className='h-4 w-4' />
                  导出PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 报表内容 */}
      <div className='bg-white p-8 print:p-4 print:shadow-none shadow-lg'>
        {/* 报表头部 */}
        <div className='text-center mb-6'>
          <div className='flex justify-between items-start mb-2'>
            <div className='text-left'>
              <span className='text-sm'>{new Date(date).getFullYear()}年</span>
            </div>
            <div className='text-right'>
              <span className='text-sm'>数量：{reportData.totals.overall}</span>
            </div>
          </div>

          <h1 className='text-xl font-bold mb-4'>药房处方统计表</h1>

          <div className='flex justify-between items-center text-sm mb-6'>
            <div>
              填写人：
              <span className='border-b border-gray-300 px-2'>{filledBy}</span>
            </div>
            <div>
              时间：
              <span className='border-b border-gray-300 px-2'>
                {new Date(date).getMonth() + 1}
              </span>
              月
              <span className='border-b border-gray-300 px-2'>
                {new Date(date).getDate()}
              </span>
              日
            </div>
          </div>
        </div>

        {/* 报表表格 */}
        <div className='grid grid-cols-3 gap-4'>
          {/* 内服药 */}
          <CategorySection
            title='内服'
            medicines={reportData.categories.internal}
            total={reportData.totals.internal}
          />

          {/* 外用药 */}
          <CategorySection
            title='外用'
            medicines={reportData.categories.external}
            total={reportData.totals.external}
          />

          {/* 针剂 */}
          <CategorySection
            title='针剂'
            medicines={reportData.categories.injection}
            total={reportData.totals.injection}
          />
        </div>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  medicines: Array<{
    medicineName: string;
    specification?: string;
    totalConsumption: number;
  }>;
  total: number;
}

function CategorySection({ title, medicines, total }: CategorySectionProps) {
  // 确保至少显示10行
  const displayRows = Math.max(10, medicines.length);
  const emptyRows = displayRows - medicines.length;

  return (
    <div className='border border-gray-400'>
      {/* 分类标题 */}
      <div className='bg-gray-100 text-center py-2 border-b border-gray-400 font-medium'>
        {title}
      </div>

      {/* 表头 */}
      <div className='grid grid-cols-5 border-b border-gray-400 text-xs font-medium'>
        <div className='border-r border-gray-400 p-1 text-center'>类别</div>
        <div className='border-r border-gray-400 p-1 text-center'>品名</div>
        <div className='border-r border-gray-400 p-1 text-center'>规格</div>
        <div className='border-r border-gray-400 p-1 text-center'>数量</div>
        <div className='p-1 text-center'>合计</div>
      </div>

      {/* 数据行 */}
      {medicines.map((medicine, index) => (
        <div
          key={index}
          className='grid grid-cols-5 border-b border-gray-300 text-xs'
        >
          <div className='border-r border-gray-300 p-1 text-center'>
            {title}
          </div>
          <div
            className='border-r border-gray-300 p-1 text-center truncate'
            title={medicine.medicineName}
          >
            {medicine.medicineName}
          </div>
          <div
            className='border-r border-gray-300 p-1 text-center truncate'
            title={medicine.specification}
          >
            {medicine.specification || '-'}
          </div>
          <div className='border-r border-gray-300 p-1 text-center'>
            {medicine.totalConsumption} 件
          </div>
          <div className='p-1 text-center'>
            {index === 0 ? `${total} 件` : ''}
          </div>
        </div>
      ))}

      {/* 空行 */}
      {Array.from({ length: emptyRows }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className='grid grid-cols-5 border-b border-gray-300 text-xs h-6'
        >
          <div className='border-r border-gray-300'></div>
          <div className='border-r border-gray-300'></div>
          <div className='border-r border-gray-300'></div>
          <div className='border-r border-gray-300'></div>
          <div></div>
        </div>
      ))}
    </div>
  );
}

export default DailyConsumptionReport;
