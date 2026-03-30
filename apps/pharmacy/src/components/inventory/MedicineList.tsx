import {
  Download,
  Edit,
  FileSpreadsheet,
  Layers,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMedicines } from '@/hooks/use-medicines';
import type { Medicine } from '@/types/database';

interface MedicineListProps {
  onAddMedicine: () => void;
  onEditMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (medicine: Medicine) => void;
  onManageBatches: (medicine: Medicine) => void;
}

export function MedicineList({
  onAddMedicine,
  onEditMedicine,
  onDeleteMedicine,
  onManageBatches,
}: MedicineListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const {
    data: medicines,
    isLoading,
    isError,
  } = useMedicines({
    search: searchQuery,
    sortBy,
    sortOrder,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 过滤后的药品数据（用于导出）
  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];

    if (!searchQuery.trim()) {
      return medicines;
    }

    const query = searchQuery.toLowerCase();
    return medicines.filter(
      medicine =>
        medicine.name.toLowerCase().includes(query) ||
        medicine.barcode.toLowerCase().includes(query) ||
        (medicine.manufacturer &&
          medicine.manufacturer.toLowerCase().includes(query))
    );
  }, [medicines, searchQuery]);

  // 导出功能
  const handleExportCSV = () => {
    try {
      if (!filteredMedicines || filteredMedicines.length === 0) {
        alert('没有数据可导出');
        return;
      }

      const exportData = filteredMedicines.map(medicine => ({
        barcode: medicine.barcode,
        name: medicine.name,
        specification: medicine.specification || '',
        manufacturer: medicine.manufacturer || '',
        shelf_location: medicine.shelf_location || '',
        safety_stock: medicine.safety_stock,
        unit: medicine.unit,
        category:
          medicine.category === 'internal'
            ? '内服'
            : medicine.category === 'external'
              ? '外用'
              : '针剂',
        created_at: new Date(medicine.created_at).toLocaleDateString('zh-CN'),
        updated_at: new Date(medicine.updated_at).toLocaleDateString('zh-CN'),
      }));

      const headers = {
        barcode: '条码',
        name: '药品名称',
        specification: '规格',
        manufacturer: '生产厂家',
        shelf_location: '货架位置',
        safety_stock: '安全库存',
        unit: '单位',
        category: '分类',
        created_at: '创建时间',
        updated_at: '更新时间',
      };

      // 简单的CSV导出实现
      const csvContent = [
        Object.values(headers).join(','),
        ...exportData.map(row => Object.values(row).join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `药品列表_${new Date().toLocaleDateString('zh-CN')}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出CSV失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleExportExcel = () => {
    alert('Excel导出功能将在后续版本实现');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (
    newSortBy: 'name' | 'created_at' | 'updated_at'
  ) => {
    if (sortBy === newSortBy) {
      toggleSortOrder();
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <CardTitle className='text-xl font-semibold'>药品列表</CardTitle>
        <div className='flex items-center gap-2'>
          {/* 导出按钮 */}
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportCSV}
              className='flex items-center gap-1'
            >
              <Download className='h-4 w-4' />
              <span className='hidden sm:inline'>CSV</span>
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportExcel}
              className='flex items-center gap-1'
            >
              <FileSpreadsheet className='h-4 w-4' />
              <span className='hidden sm:inline'>Excel</span>
            </Button>
          </div>
          {/* 添加药品按钮 */}
          <Button
            onClick={onAddMedicine}
            className='flex items-center gap-1 shrink-0'
          >
            <Plus className='h-4 w-4' />
            <span className='hidden sm:inline'>添加药品</span>
            <span className='sm:hidden'>添加</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='mb-4 flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='搜索药品名称、条码或厂家...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='pl-8 h-10'
            />
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-pulse text-center'>
              <div className='h-4 w-32 rounded bg-muted mx-auto'></div>
              <p className='mt-2 text-sm text-muted-foreground'>加载中...</p>
            </div>
          </div>
        ) : isError ? (
          <div className='py-8 text-center'>
            <p className='text-error'>加载药品数据失败</p>
            <Button
              variant='outline'
              className='mt-2'
              onClick={() => window.location.reload()}
            >
              重试
            </Button>
          </div>
        ) : medicines && medicines.length > 0 ? (
          <>
            {/* 桌面端表格视图 */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b'>
                    <th
                      className='px-4 py-2 text-left cursor-pointer hover:bg-muted/50'
                      onClick={() => handleSortChange('name')}
                    >
                      药品名称{' '}
                      {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className='px-4 py-2 text-left'>条码</th>
                    <th className='px-4 py-2 text-left'>规格</th>
                    <th className='px-4 py-2 text-left'>生产厂家</th>
                    <th className='px-4 py-2 text-left'>货架位置</th>
                    <th className='px-4 py-2 text-left'>安全库存</th>
                    <th className='px-4 py-2 text-right'>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(medicine => (
                    <tr
                      key={medicine.id}
                      className='border-b hover:bg-muted/50'
                    >
                      <td className='px-4 py-2'>{medicine.name}</td>
                      <td className='px-4 py-2'>{medicine.barcode}</td>
                      <td className='px-4 py-2'>
                        {medicine.specification || '-'}
                      </td>
                      <td className='px-4 py-2'>
                        {medicine.manufacturer || '-'}
                      </td>
                      <td className='px-4 py-2'>
                        {medicine.shelf_location || '-'}
                      </td>
                      <td className='px-4 py-2'>
                        {medicine.safety_stock} {medicine.unit}
                      </td>
                      <td className='px-4 py-2 text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onManageBatches(medicine)}
                            className='h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10'
                            title='管理批次'
                          >
                            <Layers className='h-4 w-4' />
                            <span className='sr-only'>批次</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEditMedicine(medicine)}
                            className='h-8 w-8 p-0'
                            title='编辑药品'
                          >
                            <Edit className='h-4 w-4' />
                            <span className='sr-only'>编辑</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onDeleteMedicine(medicine)}
                            className='h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                            title='删除药品'
                          >
                            <Trash2 className='h-4 w-4' />
                            <span className='sr-only'>删除</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片视图 */}
            <div className='md:hidden space-y-3'>
              {medicines.map(medicine => (
                <Card key={medicine.id} className='w-full'>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-lg text-gray-900 truncate'>
                          {medicine.name}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          条码: {medicine.barcode}
                        </p>
                      </div>
                      <div className='flex gap-1 ml-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onManageBatches(medicine)}
                          className='h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10'
                          title='管理批次'
                        >
                          <Layers className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onEditMedicine(medicine)}
                          className='h-8 w-8 p-0'
                          title='编辑药品'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onDeleteMedicine(medicine)}
                          className='h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                          title='删除药品'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <span className='text-gray-500'>规格:</span>
                        <span className='ml-1 text-gray-900'>
                          {medicine.specification || '-'}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>厂家:</span>
                        <span className='ml-1 text-gray-900'>
                          {medicine.manufacturer || '-'}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>位置:</span>
                        <span className='ml-1 text-gray-900'>
                          {medicine.shelf_location || '-'}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>安全库存:</span>
                        <span className='ml-1 text-gray-900'>
                          {medicine.safety_stock} {medicine.unit}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>暂无药品数据</p>
            <Button variant='outline' className='mt-2' onClick={onAddMedicine}>
              添加药品
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
