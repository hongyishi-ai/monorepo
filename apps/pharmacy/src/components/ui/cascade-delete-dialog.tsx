import { AlertTriangle, Database, Package } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface CascadeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  itemName: string;
  itemType: 'medicine' | 'batch';
  dependencies?: {
    transaction_count?: number;
    batch_count?: number;
    medicine_name?: string;
    batch_number?: string;
  };
}

export const CascadeDeleteDialog: React.FC<CascadeDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  itemName,
  itemType,
  dependencies,
}) => {
  const hasTransactions = (dependencies?.transaction_count || 0) > 0;
  const hasBatches = (dependencies?.batch_count || 0) > 0;
  const hasAnyDependencies = hasTransactions || hasBatches;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-4'>
              <p>
                确定要删除{itemType === 'medicine' ? '药品' : '批次'} &ldquo;
                <span className='font-medium'>{itemName}</span>&rdquo; 吗？
              </p>

              {hasAnyDependencies && (
                <Alert className='border-destructive/50 bg-destructive/5'>
                  <AlertTriangle className='h-4 w-4 text-destructive' />
                  <AlertDescription className='space-y-3'>
                    <p className='font-medium text-destructive'>
                      警告：此操作将同时删除以下关联数据
                    </p>

                    <div className='space-y-2'>
                      {hasTransactions && (
                        <div className='flex items-center gap-2'>
                          <Database className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>库存交易记录</span>
                          <Badge variant='destructive' className='text-xs'>
                            {dependencies?.transaction_count} 条
                          </Badge>
                        </div>
                      )}

                      {hasBatches && (
                        <div className='flex items-center gap-2'>
                          <Package className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>批次记录</span>
                          <Badge variant='destructive' className='text-xs'>
                            {dependencies?.batch_count} 个
                          </Badge>
                        </div>
                      )}
                    </div>

                    <p className='text-xs text-muted-foreground'>
                      此操作不可撤销，请谨慎操作。
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {!hasAnyDependencies && (
                <p className='text-sm text-muted-foreground'>
                  此操作不可撤销。
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isLoading ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
