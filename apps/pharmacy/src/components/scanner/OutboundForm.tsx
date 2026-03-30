/**
 * 出库表单组件
 * 用于统一的出/入库页面中的出库功能
 */

import { CalendarIcon } from 'lucide-react';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { MedicineSearchCard } from './MedicineSearchCard';

import { Calendar } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormSkeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useBatchesByMedicine } from '@/hooks/use-batches';
import type { Batch, Medicine } from '@/types/database';

interface OutboundFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  medicineData: Medicine | null | undefined;
  isMedicineLoading: boolean;
  medicine: Medicine | null;
  setMedicine: (medicine: Medicine | null) => void;
  batches: Batch[];
  setBatches: (batches: Batch[]) => void;
  selectedBatch: Batch | null;
  setSelectedBatch: (batch: Batch | null) => void;
  isSuccess: boolean;
  isProcessing: boolean;
  onSubmit: () => void;
  selectedSearchMedicine?: Medicine | null;
  onClearSearchMedicine?: () => void;
}

export function OutboundForm({
  form,
  medicineData,
  isMedicineLoading,
  medicine,
  setMedicine,
  batches,
  setBatches,
  selectedBatch,
  setSelectedBatch,
  isSuccess,
  isProcessing,
  onSubmit,
  selectedSearchMedicine,
  onClearSearchMedicine,
}: OutboundFormProps) {
  const { register, handleSubmit, setValue, watch, formState } = form;
  const { isValid } = formState;

  const barcodeValue = watch('barcode');
  const batchIdValue = watch('batch_id');
  const quantityValue = watch('quantity');

  // 查询药品的批次信息
  const { data: batchesData, isLoading: isBatchesLoading } =
    useBatchesByMedicine(medicine?.id || '', !!medicine?.id);

  // 处理药品数据变化
  useEffect(() => {
    if (medicineData && barcodeValue) {
      setMedicine(medicineData);
    } else if (barcodeValue && !isMedicineLoading && !medicineData) {
      setMedicine(null);
      setBatches([]);
      setSelectedBatch(null);
    }
  }, [
    medicineData,
    barcodeValue,
    isMedicineLoading,
    setMedicine,
    setBatches,
    setSelectedBatch,
  ]);

  // 处理批次数据变化
  useEffect(() => {
    if (batchesData) {
      // 只显示有库存的批次
      const availableBatches = batchesData.filter(batch => batch.quantity > 0);
      setBatches(availableBatches);

      // 自动选择批次（先进先出原则）
      if (availableBatches.length > 0 && !batchIdValue) {
        const sortedBatches = [...availableBatches].sort(
          (a, b) =>
            new Date(a.expiry_date).getTime() -
            new Date(b.expiry_date).getTime()
        );
        setValue('batch_id', sortedBatches[0].id);
      }
    }
  }, [batchesData, batchIdValue, setValue, setBatches]);

  // 处理批次选择变化
  useEffect(() => {
    if (batchIdValue && batches.length > 0) {
      const batch = batches.find(b => b.id === batchIdValue);
      setSelectedBatch(batch || null);
    }
  }, [batchIdValue, batches, setSelectedBatch]);

  // 获取可用数量
  const getAvailableQuantity = () => {
    return selectedBatch?.quantity || 0;
  };

  // 验证出库数量
  const validateQuantity = () => {
    if (!selectedBatch) return true;
    const availableQuantity = getAvailableQuantity();
    return Number(quantityValue) <= availableQuantity;
  };

  // 检查表单是否可以提交
  const canSubmit = () => {
    return (
      isValid &&
      medicine &&
      selectedBatch &&
      validateQuantity() &&
      !isProcessing
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (!barcodeValue) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {/* 成功提示 */}
        {isSuccess && (
          <Alert className='bg-green-50 border-green-500'>
            <AlertDescription className='text-green-700'>
              出库操作成功！
            </AlertDescription>
          </Alert>
        )}

        {/* 搜索选中的药品信息 */}
        {selectedSearchMedicine && onClearSearchMedicine && (
          <MedicineSearchCard
            medicine={selectedSearchMedicine}
            onClear={onClearSearchMedicine}
            title='通过搜索选择的药品'
          />
        )}

        {/* 药品不存在提示 */}
        {!isMedicineLoading && barcodeValue && !medicine && (
          <Alert variant='destructive'>
            <AlertDescription>
              未找到该条码对应的药品，请先入库或检查条码是否正确
            </AlertDescription>
          </Alert>
        )}

        {/* 药品信息卡片 */}
        {isMedicineLoading && (
          <Card className='shadow-sm'>
            <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>药品信息</CardTitle>
            </CardHeader>
            <CardContent className='px-4 sm:px-6'>
              <FormSkeleton fieldCount={4} />
            </CardContent>
          </Card>
        )}

        {/* 药品信息显示 */}
        {medicine && (
          <Card className='shadow-sm'>
            <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>药品信息</CardTitle>
            </CardHeader>
            <CardContent className='px-4 sm:px-6 space-y-3'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500'>条码:</span>
                  <span className='ml-2 font-mono'>{medicine.barcode}</span>
                </div>
                <div>
                  <span className='text-gray-500'>名称:</span>
                  <span className='ml-2 font-semibold'>{medicine.name}</span>
                </div>
                <div>
                  <span className='text-gray-500'>规格:</span>
                  <span className='ml-2'>{medicine.specification || '-'}</span>
                </div>
                <div>
                  <span className='text-gray-500'>厂家:</span>
                  <span className='ml-2'>{medicine.manufacturer || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 出库信息表单 */}
        {medicine && (
          <Card className='shadow-sm'>
            <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>出库信息</CardTitle>
            </CardHeader>
            <CardContent className='px-4 sm:px-6 space-y-4'>
              {/* 条码（隐藏字段） */}
              <input type='hidden' {...register('barcode')} />

              {/* 批次选择 */}
              <FormField
                control={form.control}
                name='batch_id'
                render={() => (
                  <FormItem>
                    <FormLabel>选择批次 *</FormLabel>
                    {isBatchesLoading ? (
                      <div className='h-10 bg-gray-100 rounded animate-pulse' />
                    ) : (
                      <Select
                        value={batchIdValue}
                        onValueChange={value => setValue('batch_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='请选择批次' />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map(batch => (
                            <SelectItem key={batch.id} value={batch.id}>
                              <div className='flex flex-col'>
                                <span className='font-medium'>
                                  {batch.batch_number}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  有效期: {formatDate(batch.expiry_date)} |
                                  库存: {batch.quantity}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 可用数量显示 */}
              {selectedBatch && (
                <div className='p-3 bg-blue-50 rounded-lg'>
                  <div className='text-sm text-blue-800'>
                    <div className='font-medium'>批次信息</div>
                    <div className='mt-1 space-y-1'>
                      <div>批次号: {selectedBatch.batch_number}</div>
                      <div>有效期: {formatDate(selectedBatch.expiry_date)}</div>
                      <div>
                        可用数量: {getAvailableQuantity()}{' '}
                        {medicine?.unit || selectedSearchMedicine?.unit || '盒'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 出库数量 */}
              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>出库数量 *</FormLabel>
                    <div className='flex gap-2 items-center'>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          max={getAvailableQuantity()}
                          placeholder='请输入出库数量'
                          className='flex-1'
                          {...field}
                        />
                      </FormControl>
                      <span className='text-sm text-muted-foreground min-w-0'>
                        {medicine?.unit || selectedSearchMedicine?.unit || '盒'}
                      </span>
                    </div>
                    <FormMessage />
                    {!validateQuantity() && (
                      <p className='text-sm text-red-600'>
                        出库数量不能超过可用数量 ({getAvailableQuantity()}{' '}
                        {medicine?.unit || selectedSearchMedicine?.unit || '盒'}
                        )
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* 备注 */}
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入备注信息（可选）'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 出库日期（仅 UI，不影响校验/提交；没有该字段时等同于可选占位） */}
              <FormField
                control={form.control}
                name='outbound_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>出库日期</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                            type='button'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field?.value ? field.value : '选择日期（可选）'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          value={field?.value}
                          onChange={value => field?.onChange?.(value)}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className='px-4 sm:px-6 pt-4'>
              <Button
                type='submit'
                loading={isProcessing || !canSubmit()}
                className='w-full h-9 sm:h-10 text-xs sm:text-sm'
              >
                {isProcessing ? '处理中...' : '确认出库'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </Form>
  );
}
