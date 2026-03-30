/**
 * 可撤回交易列表组件
 * 显示用户可以撤回的出库操作
 */

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AlertTriangle, Clock, RefreshCw, Undo2 } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/alert-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
// import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFormatTimeRemaining,
  useMyUndoableTransactions,
  useUndoOutboundTransaction,
  useUndoStatusColor,
} from '@/hooks/use-undo-transaction';
import type { UndoableTransactionWithDetails } from '@/types/database';

interface UndoTransactionListProps {
  showAllUsers?: boolean;
  userId?: string;
}

export const UndoTransactionList: React.FC<UndoTransactionListProps> = () => {
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useMyUndoableTransactions();
  const undoMutation = useUndoOutboundTransaction();
  const formatTimeRemaining = useFormatTimeRemaining();
  const getUndoStatusColor = useUndoStatusColor();

  const handleUndo = (transactionId: string) => {
    undoMutation.mutate(transactionId, {
      onSuccess: () => toast.success('撤回成功', '出库已撤回并恢复库存'),
      onError: (e: unknown) =>
        toast.error('撤回失败', e instanceof Error ? e.message : '未知错误'),
    });
  };

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          加载可撤回交易失败: {error.message}
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            className='ml-2'
          >
            <RefreshCw className='w-4 h-4 mr-1' />
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Undo2 className='w-5 h-5' />
          可撤回的出库操作
        </CardTitle>
        <CardDescription>
          出库操作在24小时内可以撤回，撤回后将恢复库存数量
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
                <Skeleton className='h-9 w-20' />
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Undo2 className='w-12 h-12 mx-auto mb-4 text-gray-300' />
            <p>暂无可撤回的交易</p>
            <p className='text-sm mt-2'>出库操作后24小时内可以在此撤回</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {transactions.map(transaction => (
              <UndoTransactionItem
                key={transaction.id}
                transaction={transaction}
                onUndo={handleUndo}
                isUndoing={undoMutation.isPending}
                formatTimeRemaining={formatTimeRemaining}
                getUndoStatusColor={getUndoStatusColor}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface UndoTransactionItemProps {
  transaction: UndoableTransactionWithDetails;
  onUndo: (transactionId: string) => void;
  isUndoing: boolean;
  formatTimeRemaining: (timeRemaining: string) => string;
  getUndoStatusColor: (
    timeRemaining: string
  ) => 'success' | 'warning' | 'destructive';
}

const UndoTransactionItem: React.FC<UndoTransactionItemProps> = ({
  transaction,
  onUndo,
  isUndoing,
  formatTimeRemaining,
  getUndoStatusColor,
}) => {
  const timeRemaining = formatTimeRemaining(transaction.time_remaining);
  const statusColor = getUndoStatusColor(transaction.time_remaining);
  const isExpired = timeRemaining === '已过期';

  return (
    <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'>
      <div className='flex-1 space-y-2'>
        <div className='flex items-center gap-2'>
          <h4 className='font-medium'>{transaction.medicine_name}</h4>
          <Badge variant='outline'>批次: {transaction.batch_number}</Badge>
          <Badge variant='secondary'>
            数量: {transaction.original_quantity}
          </Badge>
        </div>

        <div className='flex items-center gap-4 text-sm text-gray-600'>
          <span>操作人: {transaction.user_name}</span>
          <span>
            操作时间:{' '}
            {format(new Date(transaction.created_at), 'MM-dd HH:mm', {
              locale: zhCN,
            })}
          </span>
          <div className='flex items-center gap-1'>
            <Clock className='w-4 h-4' />
            <Badge variant={statusColor}>
              {isExpired ? '已过期' : `剩余 ${timeRemaining}`}
            </Badge>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <UndoConfirmButton
          transactionId={transaction.id}
          disabled={isExpired}
          loading={isUndoing}
          onConfirm={onUndo}
        />
      </div>
    </div>
  );
};

function UndoConfirmButton({
  transactionId,
  disabled,
  loading,
  onConfirm,
}: {
  transactionId: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant='outline'
        size='sm'
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
      >
        <Undo2 className='w-4 h-4 mr-2' /> 撤回
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => onConfirm(transactionId)}
        title='确认撤回出库操作'
        description='撤回后将恢复库存数量，此操作不可逆。'
        loading={loading}
      />
    </>
  );
}
