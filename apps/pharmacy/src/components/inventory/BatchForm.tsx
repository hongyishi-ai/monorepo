import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Calendar } from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Batch, Medicine } from '@/types/database';

// 创建验证 schema 的函数，根据是否编辑模式调整验证规则
const createBatchSchema = (isEditing: boolean) => {
  const baseSchema = z.object({
    batch_number: isEditing
      ? z.string().optional() // 编辑模式下批次号可选，因为字段被禁用
      : z.string().min(1, '批次号不能为空'),
    production_date: z.string().min(1, '生产日期不能为空'),
    expiry_date: z.string().min(1, '有效期不能为空'),
    quantity: z.coerce.number().int().positive('数量必须大于0'),
  });

  return baseSchema
    .refine(
      data => {
        // 验证生产日期不能晚于有效期
        const productionDate = new Date(data.production_date);
        const expiryDate = new Date(data.expiry_date);
        return productionDate < expiryDate;
      },
      {
        message: '生产日期不能晚于有效期',
        path: ['expiry_date'],
      }
    )
    .refine(
      data => {
        // 验证生产日期不能晚于当前日期
        const productionDate = new Date(data.production_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return productionDate <= today;
      },
      {
        message: '生产日期不能晚于当前日期',
        path: ['production_date'],
      }
    );
};

type BatchFormValues = {
  batch_number?: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
};

interface BatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Required<BatchFormValues>) => void;
  initialData?: Batch;
  medicine: Medicine;
  isSubmitting: boolean;
}

export function BatchForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  medicine,
  isSubmitting,
}: BatchFormProps) {
  const isEditing = !!initialData;
  const today = new Date().toISOString().split('T')[0];

  // 创建动态schema
  const batchSchema = createBatchSchema(isEditing);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: initialData
      ? {
          batch_number: initialData.batch_number,
          production_date: initialData.production_date.split('T')[0],
          expiry_date: initialData.expiry_date.split('T')[0],
          quantity: initialData.quantity,
        }
      : {
          batch_number: '',
          production_date: today,
          expiry_date: '',
          quantity: 0,
        },
  });

  // 当 initialData 或 isOpen 变化时重置表单
  useEffect(() => {
    if (isOpen) {
      const defaultValues = initialData
        ? {
            batch_number: initialData.batch_number,
            production_date: initialData.production_date.split('T')[0],
            expiry_date: initialData.expiry_date.split('T')[0],
            quantity: initialData.quantity,
          }
        : {
            batch_number: '',
            production_date: today,
            expiry_date: '',
            quantity: 0,
          };
      reset(defaultValues);
    }
  }, [initialData, isOpen, reset, today]);

  // 处理表单提交
  const handleFormSubmit = (data: Record<string, unknown>) => {
    // 在编辑模式下，确保包含原始的批次号
    const submitData =
      isEditing && initialData
        ? { ...data, batch_number: initialData.batch_number }
        : { ...data, batch_number: data.batch_number || '' };
    onSubmit(submitData as Required<BatchFormValues>);
  };

  // 关闭对话框时重置表单
  const handleDialogClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑批次' : `添加批次 - ${medicine.name}`}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='space-y-4 py-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='batch_number'>
              批次号 <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='batch_number'
              {...register('batch_number')}
              disabled={isEditing} // 编辑时不允许修改批次号
            />
            {errors.batch_number && (
              <p className='text-xs text-destructive'>
                {errors.batch_number.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='production_date'>
                生产日期 <span className='text-destructive'>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {watch('production_date') || today}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    value={watch('production_date')}
                    onChange={value =>
                      setValue('production_date', value, {
                        shouldValidate: true,
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
              {errors.production_date && (
                <p className='text-xs text-destructive'>
                  {errors.production_date.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expiry_date'>
                有效期 <span className='text-destructive'>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {watch('expiry_date') || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    value={watch('expiry_date')}
                    onChange={value =>
                      setValue('expiry_date', value, { shouldValidate: true })
                    }
                  />
                </PopoverContent>
              </Popover>
              {errors.expiry_date && (
                <p className='text-xs text-destructive'>
                  {errors.expiry_date.message}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='quantity'>
              数量 ({medicine.unit}) <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='quantity'
              type='number'
              min='1'
              {...register('quantity')}
              placeholder={`请输入数量 (${medicine.unit})`}
            />
            {errors.quantity && (
              <p className='text-xs text-destructive'>
                {errors.quantity.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleDialogClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type='submit' loading={isSubmitting}>
              {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '添加批次'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
