import { zodResolver } from '@hookform/resolvers/zod';
import { QrCode, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
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
import type { Medicine } from '@/types/database';

// 表单验证 schema
const medicineSchema = z.object({
  barcode: z.string().min(1, '条码不能为空'),
  name: z.string().min(1, '药品名称不能为空'),
  specification: z.string().optional(),
  manufacturer: z.string().optional(),
  shelf_location: z.string().optional(),
  safety_stock: z.coerce
    .number()
    .int()
    .nonnegative('安全库存不能为负数')
    .min(1, '安全库存不能为空'),
  unit: z.string().min(1, '单位不能为空').default('盒'),
  category: z.enum(['internal', 'external', 'injection']).default('internal'),
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicineFormValues) => void;
  initialData?: Medicine;
  isSubmitting: boolean;
}

export function MedicineForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: MedicineFormProps) {
  const isEditing = !!initialData;
  const [showScanner, setShowScanner] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: initialData
      ? {
          barcode: initialData.barcode,
          name: initialData.name,
          specification: initialData.specification || '',
          manufacturer: initialData.manufacturer || '',
          shelf_location: initialData.shelf_location || '',
          safety_stock: initialData.safety_stock,
          unit: initialData.unit || '盒',
          category: initialData.category,
        }
      : {
          barcode: '',
          name: '',
          specification: '',
          manufacturer: '',
          shelf_location: '',
          safety_stock: 1,
          unit: '盒',
          category: 'internal' as const,
        },
  });

  // 当 initialData 变化时重置表单
  useEffect(() => {
    if (isOpen) {
      reset(
        initialData
          ? {
              barcode: initialData.barcode,
              name: initialData.name,
              specification: initialData.specification || '',
              manufacturer: initialData.manufacturer || '',
              shelf_location: initialData.shelf_location || '',
              safety_stock: initialData.safety_stock || 1,
              unit: initialData.unit || '盒',
              category: initialData.category,
            }
          : {
              barcode: '',
              name: '',
              specification: '',
              manufacturer: '',
              shelf_location: '',
              safety_stock: 1,
              unit: '盒',
              category: 'internal' as const,
            }
      );
    }
  }, [initialData, isOpen, reset]);

  // 处理扫码成功
  const handleScanSuccess = (barcode: string) => {
    setValue('barcode', barcode);
    setShowScanner(false);
  };

  // 处理扫码错误
  const handleScanError = (error: string) => {
    console.error('扫码失败:', error);
  };

  // 打开扫码器
  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  // 关闭扫码器
  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // 处理表单提交
  const handleFormSubmit = (data: MedicineFormValues) => {
    onSubmit(data);
  };

  // 关闭对话框时重置表单
  const handleDialogClose = () => {
    // 重置表单到初始状态
    reset(
      initialData
        ? {
            barcode: initialData.barcode,
            name: initialData.name,
            specification: initialData.specification || '',
            manufacturer: initialData.manufacturer || '',
            shelf_location: initialData.shelf_location || '',
            safety_stock: initialData.safety_stock || 1,
            unit: initialData.unit || '盒',
            category: initialData.category,
          }
        : {
            barcode: '',
            name: '',
            specification: '',
            manufacturer: '',
            shelf_location: '',
            safety_stock: 1,
            unit: '盒',
            category: 'internal' as const,
          }
    );
    setShowScanner(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑药品' : '添加药品'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='space-y-4 py-4'
        >
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='barcode'>
                条码 <span className='text-destructive'>*</span>
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='barcode'
                  {...register('barcode')}
                  disabled={isEditing} // 编辑时不允许修改条码
                  className='flex-1'
                  placeholder='请输入条码或点击扫码'
                />
                {!isEditing && (
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={handleOpenScanner}
                    disabled={isSubmitting}
                    title='扫描条码'
                  >
                    <QrCode className='h-4 w-4' />
                  </Button>
                )}
              </div>
              {errors.barcode && (
                <p className='text-xs text-destructive'>
                  {errors.barcode.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name'>
                药品名称 <span className='text-destructive'>*</span>
              </Label>
              <Input id='name' {...register('name')} />
              {errors.name && (
                <p className='text-xs text-destructive'>
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='specification'>规格</Label>
              <Input id='specification' {...register('specification')} />
              {errors.specification && (
                <p className='text-xs text-destructive'>
                  {errors.specification.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='manufacturer'>生产厂家</Label>
              <Input id='manufacturer' {...register('manufacturer')} />
              {errors.manufacturer && (
                <p className='text-xs text-destructive'>
                  {errors.manufacturer.message}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='shelf_location'>货架位置</Label>
              <Input
                id='shelf_location'
                {...register('shelf_location')}
                placeholder='例如: A-01-3'
              />
              {errors.shelf_location && (
                <p className='text-xs text-destructive'>
                  {errors.shelf_location.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='unit'>
                基本单位 <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='unit'
                {...register('unit')}
                placeholder='例如: 盒、瓶、片、粒'
              />
              {errors.unit && (
                <p className='text-xs text-destructive'>
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='safety_stock'>
              安全库存 <span className='text-destructive'>*</span>
            </Label>
            <div className='flex gap-2 items-center'>
              <Input
                id='safety_stock'
                type='number'
                min='0'
                {...register('safety_stock')}
                className='flex-1'
              />
              <span className='text-sm text-muted-foreground min-w-0'>
                {watch('unit') || '盒'}
              </span>
            </div>
            {errors.safety_stock && (
              <p className='text-xs text-destructive'>
                {errors.safety_stock.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>
              药品分类 <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <select
                id='category'
                {...register('category')}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <option value='internal'>内服</option>
                <option value='external'>外用</option>
                <option value='injection'>针剂</option>
              </select>
            </div>
            {errors.category && (
              <p className='text-xs text-destructive'>
                {errors.category.message}
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
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '添加药品'}
            </Button>
          </DialogFooter>
        </form>

        {/* 扫码器 */}
        {showScanner && (
          <div className='mt-4 p-4 border rounded-lg bg-gray-50'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium'>扫描条码</h3>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleCloseScanner}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              scanType='medicine'
              scannerHeight={200}
              scannerWidth={300}
              autoStop={true}
              autoStart={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MedicineForm;
