import {
  AlertTriangle,
  Clock,
  Filter,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InventorySummary } from '@/hooks/use-inventory';
import { useInventorySummary } from '@/hooks/use-inventory';
import { cn } from '@/lib/utils';

/**
 * 库存筛选选项
 */
type InventoryFilter = 'all' | 'low-stock' | 'expiring' | 'expired' | 'normal';

/**
 * 排序选项
 */
type SortOption = 'name' | 'quantity' | 'expiry' | 'updated';

/**
 * 库存列表组件
 * 显示药品库存信息，支持搜索、筛选和排序
 */
// 表格行组件，使用 memo 优化渲染性能
const InventoryRow = memo(function InventoryRow({
  item,
  getStockStatusBadge,
  formatDate,
  getDaysUntilExpiry,
}: {
  item: InventorySummary;
  getStockStatusBadge: (item: InventorySummary) => React.ReactNode;
  formatDate: (date: string) => string;
  getDaysUntilExpiry: (date: string) => number | null;
}) {
  const daysUntilExpiry = getDaysUntilExpiry(item.nearestExpiryDate);

  return (
    <tr
      className={cn(
        'border-b hover:bg-muted/50 transition-colors',
        item.isLowStock && 'bg-red-50/50',
        item.isExpired && !item.isLowStock && 'bg-red-50/30',
        item.isExpiring &&
          !item.isLowStock &&
          !item.isExpired &&
          'bg-orange-50/50'
      )}
    >
      <td className='px-4 py-3'>
        <div className='font-medium'>{item.medicineName}</div>
      </td>
      <td className='px-4 py-3 font-mono text-sm'>{item.barcode}</td>
      <td className='px-4 py-3 text-center'>
        <span
          className={cn(
            'font-semibold',
            item.totalQuantity <= item.safetyStock
              ? 'text-red-600'
              : 'text-foreground'
          )}
        >
          {item.totalQuantity} {item.unit}
        </span>
      </td>
      <td className='px-4 py-3 text-center'>{item.availableBatches}</td>
      <td className='px-4 py-3 text-center'>
        <div className='space-y-1'>
          <div className='text-sm'>{formatDate(item.nearestExpiryDate)}</div>
          {daysUntilExpiry !== null && (
            <div
              className={cn(
                'text-xs',
                daysUntilExpiry <= 30
                  ? 'text-orange-600'
                  : 'text-muted-foreground'
              )}
            >
              {daysUntilExpiry > 0 ? `${daysUntilExpiry}天后` : '已过期'}
            </div>
          )}
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        {item.safetyStock} {item.unit}
      </td>
      <td className='px-4 py-3 text-center'>{getStockStatusBadge(item)}</td>
    </tr>
  );
});

// 表格头部组件，使用 memo 优化渲染性能
const TableHeader = memo(function TableHeader({
  sortBy,
  sortOrder,
  handleSortChange,
}: {
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  handleSortChange: (newSortBy: SortOption) => void;
}) {
  return (
    <thead>
      <tr className='border-b'>
        <th
          className='px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-colors'
          onClick={() => handleSortChange('name')}
        >
          <div className='flex items-center gap-2'>
            药品名称
            {sortBy === 'name' && (
              <span className='text-xs'>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th className='px-4 py-3 text-left'>条码</th>
        <th
          className='px-4 py-3 text-center cursor-pointer hover:bg-muted/50 transition-colors'
          onClick={() => handleSortChange('quantity')}
        >
          <div className='flex items-center justify-center gap-2'>
            库存数量
            {sortBy === 'quantity' && (
              <span className='text-xs'>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th className='px-4 py-3 text-center'>批次数</th>
        <th
          className='px-4 py-3 text-center cursor-pointer hover:bg-muted/50 transition-colors'
          onClick={() => handleSortChange('expiry')}
        >
          <div className='flex items-center justify-center gap-2'>
            最近效期
            {sortBy === 'expiry' && (
              <span className='text-xs'>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th className='px-4 py-3 text-center'>安全库存</th>
        <th className='px-4 py-3 text-center'>状态</th>
      </tr>
    </thead>
  );
});

export const InventoryList = memo(function InventoryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 从URL参数初始化筛选条件
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const orderParam = searchParams.get('order');

    if (
      filterParam &&
      ['all', 'low-stock', 'expiring', 'expired', 'normal'].includes(
        filterParam
      )
    ) {
      setFilter(filterParam as InventoryFilter);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (
      sortParam &&
      ['name', 'quantity', 'expiry', 'updated'].includes(sortParam)
    ) {
      setSortBy(sortParam as SortOption);
    }
    if (orderParam && ['asc', 'desc'].includes(orderParam)) {
      setSortOrder(orderParam as 'asc' | 'desc');
    }
  }, [searchParams]);

  const {
    data: inventorySummary,
    isLoading,
    isError,
    refetch,
  } = useInventorySummary();

  // 过滤和排序数据
  const filteredAndSortedData = useMemo(() => {
    if (!inventorySummary) return [];

    let filtered = inventorySummary;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.medicineName.toLowerCase().includes(query) ||
          item.barcode.toLowerCase().includes(query)
      );
    }

    // 状态过滤
    switch (filter) {
      case 'low-stock':
        filtered = filtered.filter(item => item.isLowStock);
        break;
      case 'expiring':
        filtered = filtered.filter(item => item.isExpiring && !item.isExpired);
        break;
      case 'expired':
        filtered = filtered.filter(item => item.isExpired);
        break;
      case 'normal':
        filtered = filtered.filter(
          item => !item.isLowStock && !item.isExpiring && !item.isExpired
        );
        break;
      default:
        // 'all' - 不过滤
        break;
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.medicineName;
          bValue = b.medicineName;
          break;
        case 'quantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'expiry':
          aValue = a.nearestExpiryDate
            ? new Date(a.nearestExpiryDate).getTime()
            : Infinity;
          bValue = b.nearestExpiryDate
            ? new Date(b.nearestExpiryDate).getTime()
            : Infinity;
          break;
        default:
          aValue = a.medicineName;
          bValue = b.medicineName;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [inventorySummary, searchQuery, filter, sortBy, sortOrder]);

  // 统计信息
  const stats = useMemo(() => {
    if (!inventorySummary)
      return { total: 0, lowStock: 0, expiring: 0, normal: 0 };

    return {
      total: inventorySummary.length,
      lowStock: inventorySummary.filter(item => item.isLowStock).length,
      expiring: inventorySummary.filter(item => item.isExpiring).length,
      normal: inventorySummary.filter(
        item => !item.isLowStock && !item.isExpiring
      ).length,
    };
  }, [inventorySummary]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      // 更新URL参数
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set('search', value);
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSortChange = useCallback(
    (newSortBy: SortOption) => {
      let newOrder: 'asc' | 'desc' = 'asc';
      if (sortBy === newSortBy) {
        newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      }

      setSortBy(newSortBy);
      setSortOrder(newOrder);

      // 更新URL参数
      const newParams = new URLSearchParams(searchParams);
      newParams.set('sort', newSortBy);
      newParams.set('order', newOrder);
      setSearchParams(newParams);
    },
    [sortBy, sortOrder, searchParams, setSearchParams]
  );

  // 导出功能
  const handleExportInventory = useCallback(
    (format: 'csv' | 'excel') => {
      try {
        if (!filteredAndSortedData || filteredAndSortedData.length === 0) {
          alert('没有数据可导出');
          return;
        }

        const exportData = filteredAndSortedData.map(item => ({
          medicine_name: item.medicineName,
          barcode: item.barcode,
          total_quantity: item.totalQuantity,
          available_batches: item.availableBatches,
          nearest_expiry_date: item.nearestExpiryDate
            ? new Date(item.nearestExpiryDate).toLocaleDateString('zh-CN')
            : '',
          safety_stock: item.safetyStock,
          unit: item.unit,
          status: item.isExpired
            ? '已过期'
            : item.isExpiring
              ? '近效期'
              : item.isLowStock
                ? '库存不足'
                : '正常',
        }));

        const headers = {
          medicine_name: '药品名称',
          barcode: '条码',
          total_quantity: '总库存',
          available_batches: '可用批次数',
          nearest_expiry_date: '最近效期',
          safety_stock: '安全库存',
          unit: '单位',
          status: '状态',
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
            `库存列表_${new Date().toLocaleDateString('zh-CN')}.csv`
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
    },
    [filteredAndSortedData]
  );

  const getStockStatusBadge = useCallback((item: InventorySummary) => {
    // 优先级：库存不足 > 已过期 > 近效期 > 正常
    if (item.isLowStock) {
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <AlertTriangle className='h-3 w-3' />
          库存不足
        </Badge>
      );
    }
    if (item.isExpired) {
      return (
        <Badge
          variant='destructive'
          className='flex items-center gap-1 bg-red-100 text-red-800 border-red-200'
        >
          <AlertTriangle className='h-3 w-3' />
          已过期
        </Badge>
      );
    }
    if (item.isExpiring) {
      return (
        <Badge
          variant='secondary'
          className='flex items-center gap-1 bg-orange-100 text-orange-800'
        >
          <Clock className='h-3 w-3' />
          近效期
        </Badge>
      );
    }
    return (
      <Badge
        variant='outline'
        className='flex items-center gap-1 text-green-700 border-green-200'
      >
        <Package className='h-3 w-3' />
        正常
      </Badge>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }, []);

  const getDaysUntilExpiry = useCallback((expiryDate: string) => {
    if (!expiryDate) return null;
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  }, []);

  const handleFilterChange = useCallback(
    (newFilter: InventoryFilter) => {
      setFilter(newFilter);

      // 更新URL参数
      const newParams = new URLSearchParams(searchParams);
      if (newFilter === 'all') {
        newParams.delete('filter');
      } else {
        newParams.set('filter', newFilter);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className='space-y-6'>
      <Card className='w-full'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              库存列表
            </CardTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              loading={isLoading}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
              刷新
            </Button>
          </div>

          {/* 说明：顶部已有全局概览卡片，这里不再重复展示统计卡，避免口径与视觉重复 */}
        </CardHeader>

        <CardContent>
          {/* 搜索和筛选 */}
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='搜索药品名称或条码...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='pl-8'
              />
            </div>

            <div className='flex gap-2'>
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className='w-32'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部</SelectItem>
                  <SelectItem value='normal'>正常</SelectItem>
                  <SelectItem value='low-stock'>库存不足</SelectItem>
                  <SelectItem value='expiring'>近效期</SelectItem>
                  <SelectItem value='expired'>已过期</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name'>按名称</SelectItem>
                  <SelectItem value='quantity'>按库存</SelectItem>
                  <SelectItem value='expiry'>按效期</SelectItem>
                </SelectContent>
              </Select>

              {/* 导出按钮 */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleExportInventory('csv')}
                className='flex items-center gap-1'
                title='导出CSV'
              >
                <span className='text-xs'>📄</span>
                <span className='hidden sm:inline text-xs'>CSV</span>
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={() => handleExportInventory('excel')}
                className='flex items-center gap-1'
                title='导出Excel'
              >
                <span className='text-xs'>📊</span>
                <span className='hidden sm:inline text-xs'>Excel</span>
              </Button>
            </div>
          </div>

          {/* 数据表格 */}
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-pulse text-center'>
                <div className='h-4 w-32 rounded bg-muted mx-auto'></div>
                <p className='mt-2 text-sm text-muted-foreground'>加载中...</p>
              </div>
            </div>
          ) : isError ? (
            <EmptyState
              description='加载库存数据失败'
              action={
                <Button
                  variant='outline'
                  className='mt-2'
                  onClick={() => refetch()}
                >
                  重试
                </Button>
              }
            />
          ) : filteredAndSortedData.length > 0 ? (
            <>
              {/* 桌面端表格视图 */}
              <div className='hidden md:block overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <TableHeader
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    handleSortChange={handleSortChange}
                  />
                  <tbody>
                    {filteredAndSortedData.map(item => (
                      <InventoryRow
                        key={item.medicineId}
                        item={item}
                        getStockStatusBadge={getStockStatusBadge}
                        formatDate={formatDate}
                        getDaysUntilExpiry={getDaysUntilExpiry}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片视图 */}
              <div className='md:hidden space-y-3'>
                {filteredAndSortedData.map(item => {
                  const daysUntilExpiry = getDaysUntilExpiry(
                    item.nearestExpiryDate
                  );
                  return (
                    <Card
                      key={item.medicineId}
                      className={cn(
                        'w-full',
                        item.isLowStock && 'border-red-200 bg-red-50/50',
                        item.isExpired &&
                          !item.isLowStock &&
                          'border-red-200 bg-red-50/30',
                        item.isExpiring &&
                          !item.isLowStock &&
                          !item.isExpired &&
                          'border-orange-200 bg-orange-50/50'
                      )}
                    >
                      <CardContent className='p-3'>
                        <div className='flex justify-between items-start mb-3'>
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-base text-gray-900 truncate'>
                              {item.medicineName}
                            </h3>
                            <p className='text-sm text-gray-600 mt-1 font-mono'>
                              {item.barcode}
                            </p>
                          </div>
                          <div className='ml-2'>
                            {getStockStatusBadge(item)}
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-2 text-sm'>
                          <div>
                            <span className='text-gray-500'>库存数量:</span>
                            <span
                              className={cn(
                                'ml-1 font-semibold',
                                item.totalQuantity <= item.safetyStock
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              )}
                            >
                              {item.totalQuantity} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-500'>批次数:</span>
                            <span className='ml-1 text-gray-900'>
                              {item.availableBatches}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-500'>最近效期:</span>
                            <div className='ml-1'>
                              <div className='text-gray-900 text-xs'>
                                {formatDate(item.nearestExpiryDate)}
                              </div>
                              {daysUntilExpiry !== null && (
                                <div
                                  className={cn(
                                    'text-xs',
                                    daysUntilExpiry <= 30
                                      ? 'text-orange-600'
                                      : 'text-gray-500'
                                  )}
                                >
                                  {daysUntilExpiry > 0
                                    ? `${daysUntilExpiry}天后`
                                    : '已过期'}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className='text-gray-500'>安全库存:</span>
                            <span className='ml-1 text-gray-900'>
                              {item.safetyStock} {item.unit}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              description={
                searchQuery || filter !== 'all'
                  ? '没有找到匹配的库存数据'
                  : '暂无库存数据'
              }
              action={
                (searchQuery || filter !== 'all') && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('all');
                      setSearchParams({});
                    }}
                  >
                    清除筛选
                  </Button>
                )
              }
            />
          )}

          {/* 结果统计 */}
          {filteredAndSortedData.length > 0 && (
            <div className='mt-4 text-sm text-muted-foreground text-center'>
              显示 {filteredAndSortedData.length} 条记录
              {(searchQuery || filter !== 'all') && ` (共 ${stats.total} 条)`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default InventoryList;
