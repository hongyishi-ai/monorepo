import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Batch } from '@/types/database';

interface BatchMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  existingBatch: Batch | null;
  newQuantity: number;
  unit?: string;
  isLoading?: boolean;
}

export function BatchMergeDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  existingBatch,
  newQuantity,
  unit = '盒',
  isLoading = false,
}: BatchMergeDialogProps) {
  if (!existingBatch) return null;

  const totalQuantity = existingBatch.quantity + newQuantity;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <span className='text-amber-600'>⚠️</span>
            批次已存在
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                检测到相同的批次号已经存在，您可以选择合并库存或取消操作。
              </p>

              <div className='bg-muted/50 p-3 rounded-lg space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>批次号:</span>
                  <Badge variant='outline'>{existingBatch.batch_number}</Badge>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>生产日期:</span>
                  <span className='text-sm'>
                    {formatDate(existingBatch.production_date)}
                  </span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>有效期:</span>
                  <span className='text-sm'>
                    {formatDate(existingBatch.expiry_date)}
                  </span>
                </div>

                <hr className='my-2' />

                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>当前库存:</span>
                  <span className='text-sm font-semibold'>
                    {existingBatch.quantity} {unit}
                  </span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>新增数量:</span>
                  <span className='text-sm font-semibold text-green-600'>
                    +{newQuantity} {unit}
                  </span>
                </div>

                <div className='flex justify-between items-center border-t pt-2'>
                  <span className='text-sm font-medium'>合并后总量:</span>
                  <span className='text-sm font-bold text-blue-600'>
                    {totalQuantity} {unit}
                  </span>
                </div>
              </div>

              <p className='text-xs text-muted-foreground'>
                选择&ldquo;合并库存&rdquo;将把新增数量添加到现有批次中。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='gap-2'>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            取消操作
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {isLoading ? '处理中...' : '合并库存'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
