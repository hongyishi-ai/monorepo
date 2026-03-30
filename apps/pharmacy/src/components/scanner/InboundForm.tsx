/**
 * 入库表单组件
 * 用于统一的出/入库页面中的入库功能
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
import { FormSkeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { Medicine } from '@/types/database';

interface InboundFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  medicineData: Medicine | null | undefined;
  isMedicineLoading: boolean;
  existingMedicine: Medicine | null;
  setExistingMedicine: (medicine: Medicine | null) => void;
  isNewMedicine: boolean;
  setIsNewMedicine: (isNew: boolean) => void;
  isSuccess: boolean;
  isProcessing: boolean;
  onSubmit: () => void;
  selectedSearchMedicine?: Medicine | null;
  onClearSearchMedicine?: () => void;
}

export function InboundForm({
  form,
  medicineData,
  isMedicineLoading,
  existingMedicine,
  setExistingMedicine,
  isNewMedicine,
  setIsNewMedicine,
  isSuccess,
  isProcessing,
  onSubmit,
  selectedSearchMedicine,
  onClearSearchMedicine,
}: InboundFormProps) {
  const { handleSubmit, setValue, watch, formState } = form;
  const { isValid } = formState;

  const barcodeValue = watch('barcode');

  // 处理药品数据变化
  useEffect(() => {
    if (medicineData && barcodeValue) {
      // 找到现有药品
      setExistingMedicine(medicineData);
      setIsNewMedicine(false);

      // 自动填充药品信息
      setValue('name', medicineData.name);
      setValue('specification', medicineData.specification || '');
      setValue('manufacturer', medicineData.manufacturer || '');
      setValue('shelf_location', medicineData.shelf_location || '');
      setValue('unit', medicineData.unit || '盒');
    } else if (
      selectedSearchMedicine &&
      barcodeValue === selectedSearchMedicine.barcode
    ) {
      // 通过搜索选择的药品
      setExistingMedicine(selectedSearchMedicine);
      setIsNewMedicine(false);

      // 自动填充药品信息
      setValue('name', selectedSearchMedicine.name);
      setValue('specification', selectedSearchMedicine.specification || '');
      setValue('manufacturer', selectedSearchMedicine.manufacturer || '');
      setValue('shelf_location', selectedSearchMedicine.shelf_location || '');
      setValue('unit', selectedSearchMedicine.unit || '盒');
    } else if (
      barcodeValue &&
      !isMedicineLoading &&
      !medicineData &&
      !selectedSearchMedicine
    ) {
      // 没有找到药品，需要创建新药品
      setExistingMedicine(null);
      setIsNewMedicine(true);
    }
  }, [
    medicineData,
    selectedSearchMedicine,
    barcodeValue,
    isMedicineLoading,
    setValue,
    setExistingMedicine,
    setIsNewMedicine,
  ]);

  // 检查表单是否可以提交
  const canSubmit = () => {
    return (
      isValid &&
      barcodeValue &&
      (existingMedicine || isNewMedicine) &&
      !isProcessing
    );
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
              入库操作成功！
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

        {/* 药品信息表单 */}
        {(existingMedicine || isNewMedicine) && (
          <Card className='shadow-sm'>
            <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>
                {isNewMedicine ? '新药品信息' : '药品信息'}
              </CardTitle>
              {isNewMedicine && (
                <p className='text-sm text-muted-foreground'>
                  该条码对应的药品不存在，请填写药品信息
                </p>
              )}
            </CardHeader>
            <CardContent className='px-4 sm:px-6 space-y-4'>
              {/* 条码 */}
              <FormField
                control={form.control}
                name='barcode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>条码 *</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className='bg-gray-50' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 药品名称 */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>药品名称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入药品名称'
                        readOnly={!isNewMedicine}
                        className={!isNewMedicine ? 'bg-gray-50' : ''}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 规格 */}
              <FormField
                control={form.control}
                name='specification'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规格</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入药品规格'
                        readOnly={!isNewMedicine}
                        className={!isNewMedicine ? 'bg-gray-50' : ''}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 生产厂家 */}
              <FormField
                control={form.control}
                name='manufacturer'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生产厂家</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入生产厂家'
                        readOnly={!isNewMedicine}
                        className={!isNewMedicine ? 'bg-gray-50' : ''}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 货架位置 */}
              <FormField
                control={form.control}
                name='shelf_location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>货架位置</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入货架位置' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* 批次信息表单 */}
        {(existingMedicine || isNewMedicine) && (
          <Card className='shadow-sm'>
            <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
              <CardTitle className='text-base sm:text-lg'>批次信息</CardTitle>
            </CardHeader>
            <CardContent className='px-4 sm:px-6 space-y-4'>
              {/* 批次号 */}
              <FormField
                control={form.control}
                name='batch_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>批次号 *</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入批次号' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 生产日期和有效期 */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='production_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生产日期 *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className='w-full justify-start text-left font-normal'
                              type='button'
                            >
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {field.value ? field.value : '选择日期'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='expiry_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>有效期 *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className='w-full justify-start text-left font-normal'
                              type='button'
                            >
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {field.value ? field.value : '选择日期'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 数量 */}
              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入库数量 *</FormLabel>
                    <div className='flex gap-2 items-center'>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          placeholder='请输入入库数量'
                          className='flex-1'
                          {...field}
                        />
                      </FormControl>
                      <span className='text-sm text-muted-foreground min-w-0'>
                        {existingMedicine?.unit ||
                          selectedSearchMedicine?.unit ||
                          '盒'}
                      </span>
                    </div>
                    <FormMessage />
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
            </CardContent>

            <CardFooter className='px-4 sm:px-6 pt-4'>
              <Button
                type='submit'
                loading={isProcessing || !canSubmit()}
                className='w-full h-9 sm:h-10 text-xs sm:text-sm'
              >
                {isProcessing ? '处理中...' : '确认入库'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </Form>
  );
}
