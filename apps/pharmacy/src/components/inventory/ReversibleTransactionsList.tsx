import { Clock, Package, RotateCcw, User } from 'lucide-react';
import { useState } from 'react';

import { ReverseTransactionDialog } from './ReverseTransactionDialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type ReversibleTransaction,
  useReversibleTransactions,
} from '@/hooks/use-inventory';
import { formatDateTime } from '@/lib/utils';

interface ReversibleTransactionsListProps {
  userId?: string;
  limit?: number;
}

export function ReversibleTransactionsList({
  userId,
  limit = 50,
}: ReversibleTransactionsListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<ReversibleTransaction | null>(null);
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useReversibleTransactions(userId, limit);

  const handleReverseClick = (transaction: ReversibleTransaction) => {
    setSelectedTransaction(transaction);
    setIsReverseDialogOpen(true);
  };

  const handleReverseSuccess = () => {
    refetch();
  };

  const getStatusBadge = (transaction: ReversibleTransaction) => {
    const hoursRemaining = Math.max(
      0,
      24 - transaction.hours_since_transaction
    );

    if (!transaction.can_reverse) {
      return <Badge variant='secondary'>已撤回</Badge>;
    }

    if (hoursRemaining <= 0) {
      return <Badge variant='destructive'>已过期</Badge>;
    }

    if (hoursRemaining <= 2) {
      return <Badge variant='destructive'>即将过期</Badge>;
    }

    if (hoursRemaining <= 6) {
      return <Badge variant='outline'>可撤回</Badge>;
    }

    return <Badge variant='default'>可撤回</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-500'>
            加载失败: {error instanceof Error ? error.message : '未知错误'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <RotateCcw className='h-5 w-5' />
            可撤回的出库操作
          </CardTitle>
          <CardDescription>
            显示24小时内的出库操作，可以撤回恢复库存
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <RotateCcw className='h-12 w-12 mx-auto mb-4 text-gray-300' />
              <p>暂无可撤回的出库操作</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格视图 */}
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>药品信息</TableHead>
                      <TableHead>批次号</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>操作员</TableHead>
                      <TableHead>操作时间</TableHead>
                      <TableHead>剩余时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(transaction => {
                      const hoursRemaining = Math.max(
                        0,
                        24 - transaction.hours_since_transaction
                      );

                      return (
                        <TableRow key={transaction.transaction_id}>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Package className='h-4 w-4 text-blue-500' />
                              <span className='font-medium'>
                                {transaction.medicine_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                              {transaction.batch_number}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className='font-semibold'>
                              {transaction.quantity} {transaction.unit || '盒'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              <User className='h-3 w-3 text-gray-400' />
                              <span className='text-sm'>
                                {transaction.operator_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              {formatDateTime(transaction.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              <Clock className='h-3 w-3 text-gray-400' />
                              <span className='text-sm'>
                                {hoursRemaining > 0
                                  ? `${hoursRemaining.toFixed(1)}小时`
                                  : '已过期'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction)}</TableCell>
                          <TableCell>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleReverseClick(transaction)}
                              disabled={
                                !transaction.can_reverse || hoursRemaining <= 0
                              }
                              className='text-xs'
                            >
                              <RotateCcw className='h-3 w-3 mr-1' />
                              撤回
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 移动端卡片视图 */}
              <div className='md:hidden space-y-4'>
                {transactions.map(transaction => {
                  const hoursRemaining = Math.max(
                    0,
                    24 - transaction.hours_since_transaction
                  );

                  return (
                    <Card
                      key={transaction.transaction_id}
                      className='shadow-sm'
                    >
                      <CardContent className='p-4'>
                        <div className='space-y-3'>
                          {/* 药品信息 */}
                          <div className='flex items-start justify-between'>
                            <div className='flex items-center gap-2 flex-1'>
                              <Package className='h-4 w-4 text-blue-500 flex-shrink-0' />
                              <span className='font-medium text-sm'>
                                {transaction.medicine_name}
                              </span>
                            </div>
                            {getStatusBadge(transaction)}
                          </div>

                          {/* 批次和数量 */}
                          <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center gap-2'>
                              <span className='text-gray-600'>批次:</span>
                              <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                                {transaction.batch_number}
                              </code>
                            </div>
                            <div className='flex items-center gap-1'>
                              <span className='text-gray-600'>数量:</span>
                              <span className='font-semibold'>
                                {transaction.quantity}{' '}
                                {transaction.unit || '盒'}
                              </span>
                            </div>
                          </div>

                          {/* 操作员和时间 */}
                          <div className='space-y-2 text-sm'>
                            <div className='flex items-center gap-2'>
                              <User className='h-3 w-3 text-gray-400' />
                              <span className='text-gray-600'>操作员:</span>
                              <span>{transaction.operator_name}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-3 w-3 text-gray-400' />
                              <span className='text-gray-600'>时间:</span>
                              <span>
                                {formatDateTime(transaction.created_at)}
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-3 w-3 text-gray-400' />
                              <span className='text-gray-600'>剩余:</span>
                              <span>
                                {hoursRemaining > 0
                                  ? `${hoursRemaining.toFixed(1)}小时`
                                  : '已过期'}
                              </span>
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className='pt-2 border-t'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleReverseClick(transaction)}
                              disabled={
                                !transaction.can_reverse || hoursRemaining <= 0
                              }
                              className='w-full text-xs'
                            >
                              <RotateCcw className='h-3 w-3 mr-1' />
                              撤回操作
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 撤回确认对话框 */}
      <ReverseTransactionDialog
        transaction={selectedTransaction}
        isOpen={isReverseDialogOpen}
        onClose={() => {
          setIsReverseDialogOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleReverseSuccess}
      />
    </>
  );
}
