import { AlertTriangle, Edit, Plus, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { useBatchesByMedicine } from '@/hooks/use-batches';
import { formatDate, getDaysUntil } from '@/lib/utils';
import type { Batch, Medicine } from '@/types/database';

interface BatchListProps {
  medicine: Medicine;
  onAddBatch: () => void;
  onEditBatch: (batch: Batch) => void;
  onDeleteBatch: (batch: Batch) => void;
}

export function BatchList({
  medicine,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
}: BatchListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'batch_number' | 'production_date' | 'expiry_date' | 'quantity'
  >('expiry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [includeEmpty, setIncludeEmpty] = useState(false);

  const {
    data: batches,
    isLoading,
    isError,
  } = useBatchesByMedicine(medicine.id);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (
    newSortBy: 'batch_number' | 'production_date' | 'expiry_date' | 'quantity'
  ) => {
    if (sortBy === newSortBy) {
      toggleSortOrder();
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // 过滤和排序批次
  const filteredBatches = batches
    ? batches
        .filter(batch => {
          // 搜索过滤
          if (
            searchQuery &&
            !batch.batch_number
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          ) {
            return false;
          }

          // 过期过滤：仅过滤掉严格小于今天的（同日到期仍视为可用）
          if (!includeExpired) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(batch.expiry_date);
            expiry.setHours(0, 0, 0, 0);
            if (expiry < today) {
              return false;
            }
          }

          // 空批次过滤
          if (!includeEmpty && batch.quantity <= 0) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // 排序
          let valueA, valueB;

          switch (sortBy) {
            case 'batch_number':
              valueA = a.batch_number;
              valueB = b.batch_number;
              break;
            case 'production_date':
              valueA = new Date(a.production_date).getTime();
              valueB = new Date(b.production_date).getTime();
              break;
            case 'expiry_date':
              valueA = new Date(a.expiry_date).getTime();
              valueB = new Date(b.expiry_date).getTime();
              break;
            case 'quantity':
              valueA = a.quantity;
              valueB = b.quantity;
              break;
            default:
              valueA = new Date(a.expiry_date).getTime();
              valueB = new Date(b.expiry_date).getTime();
          }

          return sortOrder === 'asc'
            ? valueA > valueB
              ? 1
              : -1
            : valueA < valueB
              ? 1
              : -1;
        })
    : [];

  // 导出功能
  const handleExportBatches = (format: 'csv' | 'excel') => {
    try {
      if (!filteredBatches || filteredBatches.length === 0) {
        alert('没有数据可导出');
        return;
      }

      const exportData = filteredBatches.map(batch => ({
        medicine_name: medicine.name,
        barcode: medicine.barcode,
        batch_number: batch.batch_number,
        production_date: new Date(batch.production_date).toLocaleDateString(
          'zh-CN'
        ),
        expiry_date: new Date(batch.expiry_date).toLocaleDateString('zh-CN'),
        quantity: batch.quantity,
        unit: medicine.unit,
        created_at: new Date(batch.created_at).toLocaleDateString('zh-CN'),
        updated_at: new Date(batch.updated_at).toLocaleDateString('zh-CN'),
      }));

      const headers = {
        medicine_name: '药品名称',
        barcode: '条码',
        batch_number: '批次号',
        production_date: '生产日期',
        expiry_date: '有效期',
        quantity: '数量',
        unit: '单位',
        created_at: '创建时间',
        updated_at: '更新时间',
      };

      if (format === 'csv') {
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
          `批次列表_${medicine.name}_${new Date().toLocaleDateString('zh-CN')}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Excel导出功能将在后续版本实现');
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 计算批次状态
  const getBatchStatus = (batch: Batch) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(batch.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      return { status: 'expired', label: '已过期', color: 'text-destructive' };
    }

    const daysUntilExpiry = getDaysUntil(batch.expiry_date);
    if (daysUntilExpiry <= 30) {
      return {
        status: 'expiring',
        label: `${daysUntilExpiry}天后过期`,
        color: 'text-warning',
      };
    }

    return { status: 'valid', label: '正常', color: 'text-success' };
  };

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>批次管理 - {medicine.name}</CardTitle>
        <div className='flex items-center gap-2'>
          {/* 导出按钮 */}
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleExportBatches('csv')}
            className='flex items-center gap-1'
            title='导出CSV'
          >
            <span className='text-xs'>📄</span>
            <span className='hidden sm:inline text-xs'>CSV</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => handleExportBatches('excel')}
            className='flex items-center gap-1'
            title='导出Excel'
          >
            <span className='text-xs'>📊</span>
            <span className='hidden sm:inline text-xs'>Excel</span>
          </Button>

          <Button onClick={onAddBatch} className='flex items-center gap-1'>
            <Plus className='h-4 w-4' /> 添加批次
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='mb-4 space-y-4'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='搜索批次号...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='pl-8'
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              className={includeExpired ? 'bg-muted' : ''}
              onClick={() => setIncludeExpired(!includeExpired)}
            >
              {includeExpired ? '隐藏' : '显示'}已过期批次
            </Button>
            <Button
              variant='outline'
              size='sm'
              className={includeEmpty ? 'bg-muted' : ''}
              onClick={() => setIncludeEmpty(!includeEmpty)}
            >
              {includeEmpty ? '隐藏' : '显示'}空批次
            </Button>
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
            <p className='text-error'>加载批次数据失败</p>
            <Button
              variant='outline'
              className='mt-2'
              onClick={() => window.location.reload()}
            >
              重试
            </Button>
          </div>
        ) : filteredBatches.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b'>
                  <th
                    className='px-4 py-2 text-left cursor-pointer hover:bg-muted/50'
                    onClick={() => handleSortChange('batch_number')}
                  >
                    批次号{' '}
                    {sortBy === 'batch_number' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className='px-4 py-2 text-left cursor-pointer hover:bg-muted/50'
                    onClick={() => handleSortChange('production_date')}
                  >
                    生产日期{' '}
                    {sortBy === 'production_date' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className='px-4 py-2 text-left cursor-pointer hover:bg-muted/50'
                    onClick={() => handleSortChange('expiry_date')}
                  >
                    有效期{' '}
                    {sortBy === 'expiry_date' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className='px-4 py-2 text-left cursor-pointer hover:bg-muted/50'
                    onClick={() => handleSortChange('quantity')}
                  >
                    数量{' '}
                    {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className='px-4 py-2 text-left'>状态</th>
                  <th className='px-4 py-2 text-right'>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(batch => {
                  const batchStatus = getBatchStatus(batch);
                  return (
                    <tr key={batch.id} className='border-b hover:bg-muted/50'>
                      <td className='px-4 py-2'>{batch.batch_number}</td>
                      <td className='px-4 py-2'>
                        {formatDate(batch.production_date)}
                      </td>
                      <td className='px-4 py-2'>
                        {formatDate(batch.expiry_date)}
                      </td>
                      <td className='px-4 py-2'>
                        {batch.quantity} {medicine.unit}
                      </td>
                      <td className={`px-4 py-2 ${batchStatus.color}`}>
                        <div className='flex items-center gap-1'>
                          {batchStatus.status !== 'valid' && (
                            <AlertTriangle className='h-4 w-4' />
                          )}
                          {batchStatus.label}
                        </div>
                      </td>
                      <td className='px-4 py-2 text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEditBatch(batch)}
                            className='h-8 w-8 p-0'
                          >
                            <Edit className='h-4 w-4' />
                            <span className='sr-only'>编辑</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onDeleteBatch(batch)}
                            className='h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='h-4 w-4' />
                            <span className='sr-only'>删除</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description='暂无批次数据'
            action={
              <Button variant='outline' className='mt-2' onClick={onAddBatch}>
                添加批次
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
