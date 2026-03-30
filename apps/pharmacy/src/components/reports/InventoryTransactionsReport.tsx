/**
 * 库存交易报表组件
 * 用于显示出入库记录报表
 */

import {
  ArrowUpDown,
  Download,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Calendar as UiCalendar } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useInventoryTransactions,
  type GetInventoryTransactionsParams,
} from '@/hooks/use-inventory';
import type { InventoryTransaction } from '@/types/database';

// 扩展的交易类型，包含关联数据
interface InventoryTransactionWithRelations extends InventoryTransaction {
  medicine?: {
    id: string;
    name: string;
    barcode: string;
    specification?: string;
  };
  batch?: {
    id: string;
    batch_number: string;
    expiry_date: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export function InventoryTransactionsReport() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 30天前
    endDate: new Date().toISOString().split('T')[0], // 今天
  });
  const [transactionType, setTransactionType] = useState<
    'all' | 'inbound' | 'outbound'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'quantity'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 查询参数
  const queryParams: GetInventoryTransactionsParams = useMemo(() => {
    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      type: transactionType !== 'all' ? transactionType : undefined,
      sortBy,
      sortOrder,
      limit: 100,
    };

    // 调试信息
    console.log('库存交易查询参数:', params);

    return params;
  }, [dateRange, transactionType, sortBy, sortOrder]);

  const {
    data: transactions,
    isLoading,
    refetch,
    error,
  } = useInventoryTransactions(queryParams);

  // 调试信息
  console.log('库存交易查询结果:', {
    isLoading,
    error,
    transactionCount: transactions?.length || 0,
    queryParams,
    firstTransaction: transactions?.[0],
  });

  // 类型断言，因为我们知道查询包含关联数据
  const typedTransactions = transactions as
    | InventoryTransactionWithRelations[]
    | undefined;

  // 过滤搜索结果
  const filteredTransactions = useMemo(() => {
    if (!typedTransactions) return [];
    if (!searchTerm) return typedTransactions;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return typedTransactions.filter(
      transaction =>
        transaction.medicine?.name?.toLowerCase().includes(lowerSearchTerm) ||
        transaction.medicine?.barcode
          ?.toLowerCase()
          .includes(lowerSearchTerm) ||
        transaction.batch?.batch_number
          ?.toLowerCase()
          .includes(lowerSearchTerm) ||
        transaction.user?.name?.toLowerCase().includes(lowerSearchTerm) ||
        transaction.notes?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [typedTransactions, searchTerm]);

  // 处理日期范围变更
  const handleDateRangeChange = (
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // 导出数据
  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV数据
    const headers = [
      '日期',
      '类型',
      '药品名称',
      '条码',
      '批次号',
      '数量',
      '操作人',
      '备注',
    ];
    const typeToText = (t: InventoryTransactionWithRelations['type']) => {
      switch (t) {
        case 'inbound':
          return '入库';
        case 'outbound':
          return '出库';
        case 'adjustment':
          return '调整';
        case 'expired':
          return '过期处理';
        case 'damaged':
          return '报损';
        default:
          return String(t);
      }
    };
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map((item: InventoryTransactionWithRelations) =>
        [
          new Date(item.created_at).toLocaleString('zh-CN'),
          typeToText(item.type),
          `"${item.medicine?.name || ''}"`,
          item.medicine?.barcode || '',
          item.batch?.batch_number || '',
          item.quantity,
          `"${item.user?.name || ''}"`,
          `"${item.notes || ''}"`,
        ].join(',')
      ),
    ].join('\n');

    // 下载文件
    const blob = new Blob(['\uFEFF' + csvData], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `出入库记录_${dateRange.startDate}_${dateRange.endDate}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 切换排序
  const toggleSort = (column: 'created_at' | 'quantity') => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取交易类型标签
  const getTransactionTypeLabel = (
    type: 'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged'
  ) => {
    switch (type) {
      case 'inbound':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-200'>
            入库
          </Badge>
        );
      case 'outbound':
        return (
          <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-200'>
            出库
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge className='bg-amber-100 text-amber-800 hover:bg-amber-200'>
            调整
          </Badge>
        );
      case 'expired':
        return (
          <Badge className='bg-red-100 text-red-800 hover:bg-red-200'>
            过期
          </Badge>
        );
      case 'damaged':
        return (
          <Badge className='bg-rose-100 text-rose-800 hover:bg-rose-200'>
            报损
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            出入库记录报表
          </CardTitle>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              loading={isLoading}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              />
              刷新
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExport}
              loading={isLoading || !filteredTransactions?.length}
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              导出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 筛选控件 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div>
            <label className='text-sm font-medium mb-2 block'>开始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full justify-start'>
                  {dateRange.startDate || '选择日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <UiCalendar
                  value={dateRange.startDate}
                  onChange={value => handleDateRangeChange('startDate', value)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className='text-sm font-medium mb-2 block'>结束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full justify-start'>
                  {dateRange.endDate || '选择日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <UiCalendar
                  value={dateRange.endDate}
                  onChange={value => handleDateRangeChange('endDate', value)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className='text-sm font-medium mb-2 block'>交易类型</label>
            <Select
              value={transactionType}
              onValueChange={(value: 'all' | 'inbound' | 'outbound') =>
                setTransactionType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='inbound'>入库</SelectItem>
                <SelectItem value='outbound'>出库</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='text-sm font-medium mb-2 block'>搜索</label>
            <div className='flex items-center'>
              <Search className='h-4 w-4 mr-2 text-muted-foreground' />
              <Input
                placeholder='药品名称、条码、批次号...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 交易记录显示 */}
        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <RefreshCw className='h-6 w-6 animate-spin mr-2' />
            <span>加载数据中...</span>
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <>
            {/* 桌面端表格视图 */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b'>
                    <th className='px-4 py-3 text-left'>
                      <button
                        className='flex items-center text-sm font-medium'
                        onClick={() => toggleSort('created_at')}
                      >
                        日期时间
                        <ArrowUpDown className='ml-2 h-4 w-4' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left'>类型</th>
                    <th className='px-4 py-3 text-left'>药品名称</th>
                    <th className='px-4 py-3 text-left'>条码</th>
                    <th className='px-4 py-3 text-left'>批次号</th>
                    <th className='px-4 py-3 text-center'>
                      <button
                        className='flex items-center text-sm font-medium'
                        onClick={() => toggleSort('quantity')}
                      >
                        数量
                        <ArrowUpDown className='ml-2 h-4 w-4' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left'>操作人</th>
                    <th className='px-4 py-3 text-left'>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(
                    (transaction: InventoryTransactionWithRelations) => (
                      <tr
                        key={transaction.id}
                        className='border-b hover:bg-muted/50'
                      >
                        <td className='px-4 py-3 text-sm'>
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className='px-4 py-3'>
                          {getTransactionTypeLabel(transaction.type)}
                        </td>
                        <td className='px-4 py-3 font-medium'>
                          {transaction.medicine?.name || '-'}
                        </td>
                        <td className='px-4 py-3 font-mono text-sm'>
                          {transaction.medicine?.barcode || '-'}
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {transaction.batch?.batch_number || '-'}
                        </td>
                        <td className='px-4 py-3 text-center font-semibold'>
                          {transaction.quantity}
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {transaction.user?.name || '-'}
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {transaction.notes || '-'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片视图 */}
            <div className='md:hidden space-y-3'>
              {filteredTransactions.map(
                (transaction: InventoryTransactionWithRelations) => (
                  <Card key={transaction.id} className='w-full'>
                    <CardContent className='p-4'>
                      <div className='flex justify-between items-start mb-3'>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-lg text-gray-900 truncate'>
                            {transaction.medicine?.name || '未知药品'}
                          </h3>
                          <p className='text-sm text-gray-600 mt-1'>
                            条码: {transaction.medicine?.barcode || '-'}
                          </p>
                        </div>
                        <div className='ml-2'>
                          {getTransactionTypeLabel(transaction.type)}
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-3 text-sm'>
                        <div>
                          <span className='text-gray-500'>批次号:</span>
                          <span className='ml-1 font-mono'>
                            {transaction.batch?.batch_number || '-'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>数量:</span>
                          <span className='ml-1 font-semibold'>
                            {transaction.quantity}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>操作人:</span>
                          <span className='ml-1'>
                            {transaction.user?.name || '-'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>时间:</span>
                          <span className='ml-1'>
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                      </div>

                      {transaction.notes && (
                        <div className='mt-3 pt-3 border-t border-gray-200'>
                          <span className='text-gray-500 text-sm'>备注:</span>
                          <p className='text-sm mt-1'>{transaction.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </>
        ) : (
          <div className='text-center py-12'>
            <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground'>没有找到符合条件的交易记录</p>
            <p className='text-sm text-muted-foreground mt-2'>
              请尝试调整筛选条件或日期范围
            </p>
          </div>
        )}

        {/* 分页信息 */}
        {filteredTransactions && filteredTransactions.length > 0 && (
          <div className='mt-4 text-center text-sm text-muted-foreground'>
            显示 {filteredTransactions.length} 条记录
            {filteredTransactions.length === 100 &&
              ' (最多显示100条，请缩小日期范围查看更多)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
