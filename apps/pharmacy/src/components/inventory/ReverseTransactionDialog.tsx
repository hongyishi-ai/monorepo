import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Clock, Package, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type ReversibleTransaction,
  useReverseOutboundTransaction,
} from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

// 表单验证 schema
const reverseSchema = z.object({
  reason: z
    .string()
    .min(1, '请输入撤回原因')
    .min(5, '撤回原因至少需要5个字符')
    .max(200, '撤回原因不能超过200个字符'),
});

type ReverseFormData = z.infer<typeof reverseSchema>;

interface ReverseTransactionDialogProps {
  transaction: ReversibleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReverseTransactionDialog({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: ReverseTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const reverseTransaction = useReverseOutboundTransaction();

  const form = useForm<ReverseFormData>({
    resolver: zodResolver(reverseSchema),
    defaultValues: {
      reason: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ReverseFormData) => {
    if (!transaction) return;

    try {
      setIsSubmitting(true);

      await reverseTransaction.mutateAsync({
        transaction_id: transaction.transaction_id,
        reason: data.reason,
      });

      toast({
        title: '撤回成功',
        description: `已成功撤回 ${transaction.quantity} ${transaction.unit || '盒'} ${transaction.medicine_name} 的出库操作`,
        variant: 'success',
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      toast({
        title: '撤回失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  const hoursRemaining = Math.max(0, 24 - transaction.hours_since_transaction);
  const canReverse = transaction.can_reverse && hoursRemaining > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            撤回出库操作
          </DialogTitle>
          <DialogDescription>
            确认要撤回以下出库操作吗？此操作将恢复库存数量。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 交易信息 */}
          <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
            <div className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-blue-500' />
              <span className='font-medium'>{transaction.medicine_name}</span>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-500'>批次号:</span>
                <span className='ml-2 font-mono'>
                  {transaction.batch_number}
                </span>
              </div>
              <div>
                <span className='text-gray-500'>出库数量:</span>
                <span className='ml-2 font-semibold'>
                  {transaction.quantity} {transaction.unit || '盒'}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='flex items-center gap-1'>
                <User className='h-3 w-3 text-gray-400' />
                <span className='text-gray-500'>操作员:</span>
                <span className='ml-1'>{transaction.operator_name}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3 text-gray-400' />
                <span className='text-gray-500'>时间:</span>
                <span className='ml-1'>
                  {formatDateTime(transaction.created_at)}
                </span>
              </div>
            </div>

            {/* 时间限制提示 */}
            <div className='flex items-center gap-2 text-sm'>
              <Clock className='h-4 w-4 text-orange-500' />
              <span className='text-orange-600'>
                剩余撤回时间: {hoursRemaining.toFixed(1)} 小时
              </span>
            </div>
          </div>

          {/* 撤回原因 */}
          {canReverse && (
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='reason'>
                  撤回原因 <span className='text-destructive'>*</span>
                </Label>
                <Textarea
                  id='reason'
                  {...register('reason')}
                  placeholder='请详细说明撤回此次出库操作的原因...'
                  rows={3}
                  disabled={isSubmitting}
                />
                {errors.reason && (
                  <p className='text-sm text-destructive'>
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button
                  type='submit'
                  variant='destructive'
                  disabled={isSubmitting || !canReverse}
                >
                  {isSubmitting ? '撤回中...' : '确认撤回'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* 无法撤回的提示 */}
          {!canReverse && (
            <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
              <div className='flex items-center gap-2 text-red-700'>
                <AlertTriangle className='h-4 w-4' />
                <span className='font-medium'>无法撤回</span>
              </div>
              <p className='text-sm text-red-600 mt-1'>
                {hoursRemaining <= 0
                  ? '已超过24小时撤回时限'
                  : '该交易已被撤回或不符合撤回条件'}
              </p>
              <DialogFooter className='mt-4'>
                <Button variant='outline' onClick={handleClose}>
                  关闭
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
