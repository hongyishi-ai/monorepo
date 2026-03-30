/**
 * 统一的出/入库操作页面组件
 * 合并了入库和出库功能，提供统一的用户体验
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Package, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BarcodeScanner } from './BarcodeScanner';
import { InboundForm } from './InboundForm';
import { OutboundForm } from './OutboundForm';

import { BatchMergeDialog } from '@/components/inventory/BatchMergeDialog';
import { ConfirmationDialog } from '@/components/inventory/DeleteConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedErrorDialog } from '@/components/ui/enhanced-error-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateBatchAndInbound } from '@/hooks/use-batches';
import { useOutboundInventory } from '@/hooks/use-inventory';
import {
  useCreateMedicine,
  useMedicineByBarcode,
  useSearchMedicines,
} from '@/hooks/use-medicines';
import { useToast } from '@/hooks/use-toast';
import { DEFAULTS, RPC } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useScanStore } from '@/stores/scan.store';
import type { Batch, Medicine } from '@/types/database';

// 操作类型
type OperationType = 'inbound' | 'outbound';

// 入库表单验证 schema
const inboundFormSchema = z
  .object({
    // 药品信息
    barcode: z.string().min(1, '条码不能为空'),
    name: z.string().min(1, '药品名称不能为空'),
    specification: z.string().optional(),
    manufacturer: z.string().optional(),
    shelf_location: z.string().optional(),

    // 批次信息
    batch_number: z.string().min(1, '批次号不能为空'),
    production_date: z.string().min(1, '生产日期不能为空'),
    expiry_date: z.string().min(1, '有效期不能为空'),
    quantity: z.preprocess(
      val => Number(val),
      z.number().int().positive('数量必须大于0')
    ),
    unit: z.string().optional(),

    // 备注 - 可选字段
    notes: z.string().optional().or(z.literal('')),
  })
  .refine(
    data => {
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

// 出库表单验证 schema
const outboundFormSchema = z.object({
  barcode: z.string().min(1, '条码不能为空'),
  batch_id: z.string().min(1, '请选择批次'),
  quantity: z.preprocess(
    val => Number(val),
    z.number().int().positive('数量必须大于0')
  ),
  notes: z.string().optional(),
});

/**
 * 统一的出/入库操作页面组件
 */
export function InventoryOperationPage() {
  const [operationType, setOperationType] = useState<OperationType>('inbound');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchMedicine, setSelectedSearchMedicine] =
    useState<Medicine | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // 入库相关状态
  const [existingMedicine, setExistingMedicine] = useState<Medicine | null>(
    null
  );
  const [isNewMedicine, setIsNewMedicine] = useState(false);

  // 出库相关状态
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // 批次合并相关状态
  const [isBatchMergeDialogOpen, setIsBatchMergeDialogOpen] = useState(false);
  const [existingBatchForMerge, setExistingBatchForMerge] =
    useState<Batch | null>(null);
  const [pendingInboundData, setPendingInboundData] = useState<z.infer<
    typeof inboundFormSchema
  > | null>(null);

  // 错误处理相关状态
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    details?: Array<{ field?: string; message: string; suggestion?: string }>;
    suggestions?: string[];
  } | null>(null);

  const currentScan = useScanStore(state => state.currentScan);
  const clearScan = useScanStore(state => state.clearScan);
  const setScanMode = useScanStore(state => state.setScanMode);
  const { user } = useAuthStore();
  const { toast } = useToast();

  // 获取当前日期
  const today = new Date().toISOString().split('T')[0];
  const defaultExpiryDate = new Date();
  defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
  const defaultExpiryDateStr = defaultExpiryDate.toISOString().split('T')[0];

  // 入库表单
  const inboundForm = useForm({
    resolver: zodResolver(inboundFormSchema),
    defaultValues: {
      barcode: '',
      name: '',
      specification: '',
      manufacturer: '',
      shelf_location: '',
      batch_number: '',
      production_date: today,
      expiry_date: defaultExpiryDateStr,
      quantity: 0,
      unit: '',
      notes: '',
    },
  });

  // 出库表单
  const outboundForm = useForm({
    resolver: zodResolver(outboundFormSchema),
    defaultValues: {
      barcode: '',
      batch_id: '',
      quantity: 1,
      notes: '',
    },
  });

  // 监听条码值变化
  const inboundBarcodeValue = inboundForm.watch('barcode');
  const outboundBarcodeValue = outboundForm.watch('barcode');
  const currentBarcodeValue =
    operationType === 'inbound' ? inboundBarcodeValue : outboundBarcodeValue;

  // 根据条码查询药品
  const { data: medicineData, isLoading: isMedicineLoading } =
    useMedicineByBarcode(
      currentBarcodeValue,
      !!currentBarcodeValue && currentBarcodeValue.length >= 8
    );

  // 搜索药品（用于手动输入）
  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchMedicines(searchQuery, !!searchQuery && searchQuery.length >= 2);

  // API hooks
  const createMedicine = useCreateMedicine();
  // 保留出库流程使用的入库/出库 hooks，这里仅使用单RPC入库
  const createBatchAndInbound = useCreateBatchAndInbound();
  const outboundInventory = useOutboundInventory();

  // 设置扫码模式
  useEffect(() => {
    setScanMode(operationType);
    return () => setScanMode(null);
  }, [operationType, setScanMode]);

  // 处理扫码结果
  useEffect(() => {
    if (currentScan?.barcode) {
      if (operationType === 'inbound') {
        inboundForm.setValue('barcode', currentScan.barcode);
      } else {
        outboundForm.setValue('barcode', currentScan.barcode);
      }
      setIsScanModalOpen(false);
      clearScan();
    }
  }, [currentScan, operationType, inboundForm, outboundForm, clearScan]);

  // 处理手动输入条码
  const handleManualBarcodeInput = (barcode: string) => {
    if (operationType === 'inbound') {
      inboundForm.setValue('barcode', barcode);
    } else {
      outboundForm.setValue('barcode', barcode);
    }
    setManualInput('');
  };

  // 处理药品搜索选择
  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedSearchMedicine(medicine);
    if (operationType === 'inbound') {
      inboundForm.setValue('barcode', medicine.barcode);
    } else {
      outboundForm.setValue('barcode', medicine.barcode);
    }
    setSearchQuery('');
  };

  // 清除搜索选择的药品
  const handleClearSearchMedicine = () => {
    setSelectedSearchMedicine(null);
    if (operationType === 'inbound') {
      inboundForm.setValue('barcode', '');
    } else {
      outboundForm.setValue('barcode', '');
    }
  };

  // 开始扫码
  const handleStartScan = () => {
    setIsScanModalOpen(true);
  };

  // 操作类型切换
  const handleOperationTypeChange = (value: string) => {
    const type = value as OperationType;
    setOperationType(type);
    // 重置表单和状态
    inboundForm.reset();
    outboundForm.reset();
    setExistingMedicine(null);
    setIsNewMedicine(false);
    setMedicine(null);
    setBatches([]);
    setSelectedBatch(null);
    setSearchQuery('');
    setSelectedSearchMedicine(null);
    clearScan();
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* 操作类型选择 */}
      <Card className='shadow-sm'>
        <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='text-base sm:text-lg flex items-center gap-2'>
            <Package className='h-5 w-5' />
            库存操作
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 sm:px-6'>
          <Tabs value={operationType} onValueChange={handleOperationTypeChange}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='inbound' className='flex items-center gap-2'>
                <ArrowDown className='h-4 w-4' />
                入库
              </TabsTrigger>
              <TabsTrigger value='outbound' className='flex items-center gap-2'>
                <ArrowUp className='h-4 w-4' />
                出库
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* 扫码区域 */}
      <Card className='shadow-sm'>
        <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='text-base sm:text-lg'>药品输入</CardTitle>
        </CardHeader>
        <CardContent className='px-4 sm:px-6 space-y-4'>
          {/* 条码输入和扫码按钮 */}
          <div className='space-y-2'>
            <Label htmlFor='barcode-input' className='text-sm font-medium'>
              药品条码
            </Label>
            <div className='flex gap-2'>
              <Input
                id='barcode-input'
                placeholder='请输入条码或点击扫码'
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleStartScan}
                title='扫描条码'
              >
                <QrCode className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                onClick={() => handleManualBarcodeInput(manualInput)}
                disabled={!manualInput.trim()}
                variant='outline'
              >
                确认
              </Button>
            </div>
          </div>

          {/* 药品名称搜索 */}
          <div className='space-y-2'>
            <Label htmlFor='medicine-search' className='text-sm font-medium'>
              或按药品名称搜索
            </Label>
            <div className='relative'>
              <Input
                id='medicine-search'
                placeholder='请输入药品名称进行搜索'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='flex-1'
              />
              {isSearchLoading && (
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                </div>
              )}
            </div>

            {/* 搜索结果 */}
            {searchResults && searchResults.length > 0 && searchQuery && (
              <div className='max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg'>
                {searchResults.map(medicine => (
                  <div
                    key={medicine.id}
                    className='p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0'
                    onClick={() => handleMedicineSelect(medicine)}
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-gray-900 truncate'>
                          {medicine.name}
                        </h4>
                        <p className='text-sm text-gray-600 font-mono mt-1'>
                          {medicine.barcode}
                        </p>
                        {medicine.specification && (
                          <p className='text-sm text-gray-500 mt-1'>
                            规格: {medicine.specification}
                          </p>
                        )}
                        {medicine.manufacturer && (
                          <p className='text-sm text-gray-500'>
                            厂家: {medicine.manufacturer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery &&
              searchResults &&
              searchResults.length === 0 &&
              !isSearchLoading && (
                <div className='text-sm text-gray-500 text-center py-2'>
                  未找到匹配的药品
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* 扫码对话框（统一样式） */}
      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <DialogContent className='sm:max-w-md p-0 overflow-hidden'>
          <DialogHeader className='px-4 pt-4'>
            <DialogTitle className='flex items-center gap-2 text-base'>
              <QrCode className='h-5 w-5' />
              扫描药品条码
            </DialogTitle>
          </DialogHeader>
          <div className='px-4 pb-2 text-xs text-muted-foreground'>
            请将条码置于取景框内，系统会自动识别。
          </div>
          <div className='px-4 pb-4'>
            <BarcodeScanner
              scannerHeight={260}
              scannerWidth={320}
              qrbox={200}
              autoStop={true}
              autoStart={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 根据操作类型显示不同的表单内容 */}
      {operationType === 'inbound' ? (
        <InboundForm
          form={inboundForm}
          medicineData={medicineData}
          isMedicineLoading={isMedicineLoading}
          existingMedicine={existingMedicine}
          setExistingMedicine={setExistingMedicine}
          isNewMedicine={isNewMedicine}
          setIsNewMedicine={setIsNewMedicine}
          isSuccess={isSuccess}
          isProcessing={isProcessing}
          onSubmit={() => setIsConfirmDialogOpen(true)}
          selectedSearchMedicine={selectedSearchMedicine}
          onClearSearchMedicine={handleClearSearchMedicine}
        />
      ) : (
        <OutboundForm
          form={outboundForm}
          medicineData={medicineData}
          isMedicineLoading={isMedicineLoading}
          medicine={medicine}
          setMedicine={setMedicine}
          batches={batches}
          setBatches={setBatches}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          isSuccess={isSuccess}
          isProcessing={isProcessing}
          onSubmit={() => setIsConfirmDialogOpen(true)}
          selectedSearchMedicine={selectedSearchMedicine}
          onClearSearchMedicine={handleClearSearchMedicine}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={
          operationType === 'inbound'
            ? handleInboundConfirm
            : handleOutboundConfirm
        }
        title={operationType === 'inbound' ? '确认入库' : '确认出库'}
        description={
          operationType === 'inbound'
            ? `确定要入库 ${inboundForm.watch('quantity')} ${
                inboundForm.watch('unit') || medicine?.unit || '件'
              } ${inboundForm.watch('name')} 吗？`
            : `确定要出库 ${outboundForm.watch('quantity')} ${
                medicine?.unit || '件'
              } ${medicine?.name || '药品'} 吗？`
        }
        confirmText={operationType === 'inbound' ? '确认入库' : '确认出库'}
        isLoading={isProcessing}
      />

      {/* 批次合并对话框 */}
      <BatchMergeDialog
        isOpen={isBatchMergeDialogOpen}
        onClose={() => setIsBatchMergeDialogOpen(false)}
        onConfirm={handleBatchMergeConfirm}
        onCancel={handleBatchMergeCancel}
        existingBatch={existingBatchForMerge}
        newQuantity={pendingInboundData?.quantity || 0}
        unit={
          existingMedicine?.unit ||
          selectedSearchMedicine?.unit ||
          medicine?.unit ||
          '件'
        }
        isLoading={isProcessing}
      />

      {/* 增强错误对话框 */}
      <EnhancedErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={errorDetails?.title}
        mainMessage={errorDetails?.message || ''}
        details={errorDetails?.details}
        suggestions={errorDetails?.suggestions}
        onRetry={() => {
          setIsErrorDialogOpen(false);
          if (pendingInboundData) {
            setIsConfirmDialogOpen(true);
          }
        }}
        retryLabel='重新尝试'
      />
    </div>
  );

  // 入库确认处理
  async function handleInboundConfirm() {
    if (!user) return;

    const data = inboundForm.getValues();
    setIsProcessing(true);

    try {
      let medicineId: string;

      if (isNewMedicine) {
        // 创建新药品（对齐口径：显式传 unit、category，且 safety_stock 至少为 1）
        const newMedicine = await createMedicine.mutateAsync({
          barcode: data.barcode,
          name: data.name,
          specification: data.specification || '',
          manufacturer: data.manufacturer || '',
          shelf_location: data.shelf_location,
          unit: (data.unit && String(data.unit).trim()) || DEFAULTS.unit,
          category: DEFAULTS.category,
          safety_stock: DEFAULTS.safetyStock,
        });
        medicineId = newMedicine.id;
      } else if (existingMedicine) {
        medicineId = existingMedicine.id;
      } else {
        throw new Error('药品信息不完整');
      }

      // 检查批次是否已存在
      const { data: batchCheckResult, error: batchCheckError } =
        await supabase.rpc(RPC.checkBatchExists, {
          p_medicine_id: medicineId,
          p_batch_number: data.batch_number,
        });

      if (batchCheckError) {
        throw new Error(`批次检查失败: ${batchCheckError.message}`);
      }

      // 如果批次已存在，显示合并对话框
      if (
        batchCheckResult &&
        batchCheckResult.length > 0 &&
        batchCheckResult[0].batch_exists
      ) {
        const existingBatch = batchCheckResult[0];
        setExistingBatchForMerge({
          id: existingBatch.batch_id,
          batch_number: data.batch_number,
          quantity: existingBatch.quantity,
          production_date: existingBatch.production_date,
          expiry_date: existingBatch.expiry_date,
          medicine_id: medicineId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setPendingInboundData({
          ...data,
          quantity: Number(data.quantity),
        });
        setIsConfirmDialogOpen(false);
        setIsBatchMergeDialogOpen(true);
        setIsProcessing(false);
        return;
      }

      // 如果批次不存在，使用单RPC原子化创建批次并入库
      const result = await createBatchAndInbound.mutateAsync({
        medicine_id: medicineId,
        batch_number: data.batch_number,
        production_date: data.production_date,
        expiry_date: data.expiry_date,
        quantity: Number(data.quantity),
        notes: data.notes || '',
      });

      if (!result.success) {
        if (result.batch_exists && result.batch_id) {
          // 极端竞态：在检查与提交间被他人创建。切换到合并流程
          setExistingBatchForMerge({
            id: result.batch_id,
            batch_number: data.batch_number,
            quantity: 0,
            production_date: data.production_date,
            expiry_date: data.expiry_date,
            medicine_id: medicineId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setPendingInboundData({ ...data, quantity: Number(data.quantity) });
          setIsConfirmDialogOpen(false);
          setIsBatchMergeDialogOpen(true);
          setIsProcessing(false);
          return;
        }
        throw new Error(result.error || '入库失败');
      }

      toast({
        title: '入库成功',
        description: `${data.name} 已成功入库 ${data.quantity} 件`,
        variant: 'success',
      });

      // 重置表单和状态
      handleInboundSuccessReset();
    } catch (error) {
      console.error('入库操作失败:', error);
      handleInboundError(error, {
        ...data,
        quantity: Number(data.quantity),
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmDialogOpen(false);
    }
  }

  // 出库确认处理
  async function handleOutboundConfirm() {
    if (!user || !medicine) return;

    const data = outboundForm.getValues();
    setIsProcessing(true);

    try {
      await outboundInventory.mutateAsync({
        medicine_id: medicine.id,
        batch_id: data.batch_id,
        quantity: Number(data.quantity),
        notes: data.notes,
      });

      toast({
        title: '出库成功',
        description: `${medicine.name} 已成功出库 ${data.quantity} 件`,
        variant: 'success',
      });

      // 重置表单和状态
      setIsSuccess(true);
      setTimeout(() => {
        outboundForm.reset();
        clearScan();
        setMedicine(null);
        setSelectedBatch(null);
        setIsSuccess(false);
      }, 1000);
    } catch (error) {
      console.error('出库操作失败:', error);
      toast({
        title: '出库失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmDialogOpen(false);
    }
  }

  // 批次合并确认处理
  async function handleBatchMergeConfirm() {
    if (!user || !existingBatchForMerge || !pendingInboundData) return;

    setIsProcessing(true);
    try {
      // 调用批次合并函数
      const { data: mergeResult, error: mergeError } = await supabase.rpc(
        RPC.addBatchQuantity,
        {
          p_batch_id: existingBatchForMerge.id,
          p_additional_quantity: Number(pendingInboundData.quantity),
          p_user_id: user.id,
          p_notes: pendingInboundData.notes || '批次合并入库',
        }
      );

      if (mergeError) {
        throw new Error(`批次合并失败: ${mergeError.message}`);
      }

      if (mergeResult && mergeResult.length > 0 && mergeResult[0].success) {
        toast({
          title: '入库成功',
          description: `${pendingInboundData.name} 已成功合并入库 ${pendingInboundData.quantity} ${existingMedicine?.unit || selectedSearchMedicine?.unit || '盒'}，总库存: ${mergeResult[0].new_quantity} ${existingMedicine?.unit || selectedSearchMedicine?.unit || '盒'}`,
          variant: 'success',
        });

        handleInboundSuccessReset();
      } else {
        // 走友好提示
        throw new Error(mergeResult?.[0]?.message || '批次合并失败');
      }
    } catch (error) {
      console.error('批次合并失败:', error);
      handleInboundError(error, pendingInboundData);
    } finally {
      setIsProcessing(false);
      setIsBatchMergeDialogOpen(false);
      setExistingBatchForMerge(null);
      setPendingInboundData(null);
    }
  }

  // 批次合并取消处理
  function handleBatchMergeCancel() {
    setIsBatchMergeDialogOpen(false);
    setExistingBatchForMerge(null);
    setPendingInboundData(null);
    setIsProcessing(false);
  }

  // 入库成功重置
  function handleInboundSuccessReset() {
    setIsSuccess(true);
    setTimeout(() => {
      inboundForm.reset({
        barcode: '',
        name: '',
        specification: '',
        manufacturer: '',
        shelf_location: '',
        batch_number: '',
        production_date: today,
        expiry_date: defaultExpiryDateStr,
        quantity: 0,
        unit: '',
        notes: '',
      });
      clearScan();
      setExistingMedicine(null);
      setIsNewMedicine(false);
      setIsSuccess(false);
    }, 1000);
  }

  // 入库错误处理
  function handleInboundError(
    error: unknown,
    data: z.infer<typeof inboundFormSchema>
  ) {
    const errorDetails = parseInboundError(error, data);

    setErrorDetails(errorDetails);
    setIsErrorDialogOpen(true);
  }

  // 解析入库错误
  function parseInboundError(
    error: unknown,
    data: z.infer<typeof inboundFormSchema>
  ) {
    let title = '入库失败';
    let message = '未知错误';
    const details: Array<{
      field?: string;
      message: string;
      suggestion?: string;
    }> = [];
    const suggestions: string[] = [];

    if (error instanceof Error) {
      if (
        error.message.includes(
          'duplicate key value violates unique constraint "batches_medicine_id_batch_number_key"'
        )
      ) {
        title = '批次号重复';
        message = `批次号 "${data.batch_number}" 已存在`;
        details.push({
          field: '批次号',
          message: '该药品的批次号已经存在',
          suggestion: '请使用不同的批次号或检查是否重复入库',
        });
        suggestions.push('修改批次号为唯一值');
        suggestions.push('检查是否为重复操作');
        suggestions.push('联系管理员确认批次信息');
      } else if (error.message.includes('violates foreign key constraint')) {
        title = '数据关联错误';
        message = '药品信息不存在或已被删除';
        details.push({
          field: '药品信息',
          message: '药品数据不存在',
          suggestion: '请刷新页面后重试',
        });
        suggestions.push('刷新页面重新加载数据');
        suggestions.push('重新扫描或输入药品条码');
      } else if (error.message.includes('permission denied')) {
        title = '权限不足';
        message = '您没有执行此操作的权限';
        suggestions.push('联系系统管理员获取权限');
        suggestions.push('检查您的用户角色设置');
      } else {
        message = error.message;
      }
    }

    return { title, message, details, suggestions };
  }
}
