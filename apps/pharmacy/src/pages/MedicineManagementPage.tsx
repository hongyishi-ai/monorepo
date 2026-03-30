import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { BatchForm } from '@/components/inventory/BatchForm';
import { BatchList } from '@/components/inventory/BatchList';
// import { DeleteConfirmationDialog } from '@/components/inventory/DeleteConfirmationDialog';
import { MedicineForm } from '@/components/inventory/MedicineForm';
import { MedicineList } from '@/components/inventory/MedicineList';
import { toast } from '@/components/ui/alert-toast';
import { Button } from '@/components/ui/button';
import { CascadeDeleteDialog } from '@/components/ui/cascade-delete-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateBatchAndInbound, useUpdateBatch } from '@/hooks/use-batches';
import {
  useCascadeDeleteBatch,
  useCascadeDeleteMedicine,
  usePreCheckDelete,
} from '@/hooks/use-cascade-delete';
import { useCreateMedicine, useUpdateMedicine } from '@/hooks/use-medicines';
import { RPC, TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notification.store';
import type { Batch, Medicine } from '@/types/database';

export default function MedicineManagementPage() {
  // 状态管理
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isDeleteBatchDialogOpen, setIsDeleteBatchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // 级联删除状态
  const [isCascadeDeleteDialogOpen, setIsCascadeDeleteDialogOpen] =
    useState(false);
  const [isBatchCascadeDeleteDialogOpen, setIsBatchCascadeDeleteDialogOpen] =
    useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<{
    transaction_count?: number;
    batch_count?: number;
    medicine_name?: string;
    batch_number?: string;
  }>({});

  // 通知状态
  const addNotification = useNotificationStore(state => state.addNotification);

  // 药品操作 hooks
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const cascadeDeleteMedicine = useCascadeDeleteMedicine();

  // 批次操作 hooks
  const createBatchAndInbound = useCreateBatchAndInbound();
  const updateBatch = useUpdateBatch();
  const cascadeDeleteBatch = useCascadeDeleteBatch();

  // 合并入库确认对话框状态
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{
    batchId: string;
    batchNumber: string;
    currentQuantity: number;
    productionDate: string;
    expiryDate: string;
    addQuantity: number;
  } | null>(null);

  // 删除预检查 hook
  const preCheckDelete = usePreCheckDelete();

  // 打开添加药品表单
  const handleAddMedicine = () => {
    setSelectedMedicine(null);
    setIsFormOpen(true);
  };

  // 打开编辑药品表单
  const handleEditMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsFormOpen(true);
  };

  // 关闭表单
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMedicine(null);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedMedicine(null);
  };

  // 提交表单
  const handleSubmitForm = async (data: {
    barcode: string;
    name: string;
    safety_stock: number;
    unit: string;
    specification?: string;
    manufacturer?: string;
    shelf_location?: string;
    category?: 'internal' | 'external' | 'injection';
  }) => {
    try {
      if (selectedMedicine) {
        // 更新药品
        await updateMedicine.mutateAsync({
          id: selectedMedicine.id,
          ...data,
        });
        addNotification({
          type: 'success',
          title: '操作成功',
          message: '药品更新成功',
          priority: 'medium',
        });
      } else {
        // 创建药品
        await createMedicine.mutateAsync({
          ...data,
          specification: data.specification || '',
          manufacturer: data.manufacturer || '',
          shelf_location: data.shelf_location || '',
        });
        addNotification({
          type: 'success',
          title: '操作成功',
          message: '药品添加成功',
          priority: 'medium',
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('药品操作失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: `药品${selectedMedicine ? '更新' : '添加'}失败`,
        priority: 'high',
      });
    }
  };

  // 处理删除药品（预检查）
  const handleDeleteMedicine = async (medicine: Medicine) => {
    setSelectedMedicine(medicine);

    try {
      const checkResult = await preCheckDelete.checkMedicineDelete(medicine.id);

      if (checkResult.needsConfirmation) {
        // 需要用户确认级联删除
        setDeleteDependencies(checkResult.dependencies);
        setIsCascadeDeleteDialogOpen(true);
      } else if (checkResult.canDelete) {
        // 可以直接删除
        setIsDeleteDialogOpen(true);
      } else {
        // 无法删除
        addNotification({
          type: 'error',
          title: '无法删除',
          message: checkResult.message || '删除药品失败',
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('检查删除条件失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: '检查删除条件时发生错误',
        priority: 'high',
      });
    }
  };

  // 确认删除（简单删除）
  const handleConfirmDelete = async () => {
    if (!selectedMedicine) return;

    try {
      await cascadeDeleteMedicine.mutateAsync({
        id: selectedMedicine.id,
        confirmDelete: true,
      });
      toast.success('删除成功', `已删除药品：${selectedMedicine.name}`);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('删除药品失败:', error);
      toast.error('删除失败', '请稍后重试');
    }
  };

  // 确认级联删除
  const handleConfirmCascadeDelete = async () => {
    if (!selectedMedicine) return;

    try {
      await cascadeDeleteMedicine.mutateAsync({
        id: selectedMedicine.id,
        confirmDelete: true,
      });
      toast.success('删除成功', `已删除药品：${selectedMedicine.name}`);
      handleCloseCascadeDeleteDialog();
    } catch (error) {
      console.error('级联删除药品失败:', error);
      toast.error('删除失败', '请稍后重试');
    }
  };

  // 进入批次管理模式
  const handleManageBatches = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsBatchMode(true);
  };

  // 返回药品列表
  const handleBackToMedicines = () => {
    setIsBatchMode(false);
    setSelectedMedicine(null);
  };

  // 打开添加批次表单
  const handleAddBatch = () => {
    setSelectedBatch(null);
    setIsBatchFormOpen(true);
  };

  // 打开编辑批次表单
  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsBatchFormOpen(true);
  };

  // 处理删除批次（预检查）
  const handleDeleteBatch = async (batch: Batch) => {
    setSelectedBatch(batch);

    try {
      const checkResult = await preCheckDelete.checkBatchDelete(batch.id);

      if (checkResult.needsConfirmation) {
        // 需要用户确认级联删除
        setDeleteDependencies(checkResult.dependencies);
        setIsBatchCascadeDeleteDialogOpen(true);
      } else if (checkResult.canDelete) {
        // 可以直接删除
        setIsDeleteBatchDialogOpen(true);
      } else {
        // 无法删除
        addNotification({
          type: 'error',
          title: '无法删除',
          message: checkResult.message || '删除批次失败',
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('检查删除条件失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: '检查删除条件时发生错误',
        priority: 'high',
      });
    }
  };

  // 关闭批次表单
  const handleCloseBatchForm = () => {
    setIsBatchFormOpen(false);
    setSelectedBatch(null);
  };

  // 关闭删除批次确认对话框
  const handleCloseDeleteBatchDialog = () => {
    setIsDeleteBatchDialogOpen(false);
    setSelectedBatch(null);
  };

  // 关闭级联删除对话框
  const handleCloseCascadeDeleteDialog = () => {
    setIsCascadeDeleteDialogOpen(false);
    setSelectedMedicine(null);
    setDeleteDependencies({});
  };

  // 关闭批次级联删除对话框
  const handleCloseBatchCascadeDeleteDialog = () => {
    setIsBatchCascadeDeleteDialogOpen(false);
    setSelectedBatch(null);
    setDeleteDependencies({});
  };

  // 提交批次表单
  const handleSubmitBatchForm = async (data: {
    batch_number: string;
    production_date: string;
    expiry_date: string;
    quantity: number;
  }) => {
    if (!selectedMedicine) return;

    try {
      if (selectedBatch) {
        // 更新批次
        await updateBatch.mutateAsync({
          id: selectedBatch.id,
          ...data,
        });
        addNotification({
          type: 'success',
          title: '操作成功',
          message: '批次更新成功',
          priority: 'medium',
        });
      } else {
        // 改为：创建批次并入库（权威口径）
        const result = await createBatchAndInbound.mutateAsync({
          medicine_id: selectedMedicine.id,
          batch_number: data.batch_number,
          production_date: data.production_date,
          expiry_date: data.expiry_date,
          quantity: Number(data.quantity),
          notes: '批次管理创建并入库',
        });

        if (result?.batch_exists && result.batch_id) {
          const { data: exist, error: fetchErr } = await supabase
            .from(TABLES.batches)
            .select('id,batch_number,quantity,production_date,expiry_date')
            .eq('id', result.batch_id)
            .single();
          if (fetchErr) throw new Error(fetchErr.message);

          // 保存待合并信息并弹出确认
          setPendingMerge({
            batchId: exist.id,
            batchNumber: exist.batch_number,
            currentQuantity: exist.quantity,
            productionDate: exist.production_date,
            expiryDate: exist.expiry_date,
            addQuantity: Number(data.quantity),
          });
          setIsMergeDialogOpen(true);
          return;
        }

        addNotification({
          type: 'success',
          title: '操作成功',
          message: '批次创建并入库成功',
          priority: 'medium',
        });
      }
      handleCloseBatchForm();
    } catch (error) {
      console.error('批次操作失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: `批次${selectedBatch ? '更新' : '创建并入库'}失败`,
        priority: 'high',
      });
    }
  };

  // 确认删除批次（简单删除）
  const handleConfirmDeleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      await cascadeDeleteBatch.mutateAsync({
        id: selectedBatch.id,
        confirmDelete: true,
      });
      toast.success('删除成功', `已删除批次：${selectedBatch.batch_number}`);
      handleCloseDeleteBatchDialog();
    } catch (error) {
      console.error('删除批次失败:', error);
      toast.error('删除失败', '请稍后重试');
    }
  };

  // 确认级联删除批次
  const handleConfirmBatchCascadeDelete = async () => {
    if (!selectedBatch) return;

    try {
      await cascadeDeleteBatch.mutateAsync({
        id: selectedBatch.id,
        confirmDelete: true,
      });
      toast.success('删除成功', `已删除批次：${selectedBatch.batch_number}`);
      handleCloseBatchCascadeDeleteDialog();
    } catch (error) {
      console.error('级联删除批次失败:', error);
      toast.error('删除失败', '请稍后重试');
    }
  };

  // 执行合并入库
  const handleConfirmMerge = async () => {
    if (!pendingMerge) return;
    try {
      setIsMerging(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data: mergeResult, error: mergeError } = await supabase.rpc(
        RPC.addBatchQuantity,
        {
          p_batch_id: pendingMerge.batchId,
          p_additional_quantity: pendingMerge.addQuantity,
          p_user_id: user.id,
          p_notes: '批次管理合并入库',
        }
      );
      if (mergeError) throw new Error(mergeError.message);
      if (!mergeResult?.[0]?.success) {
        throw new Error(mergeResult?.[0]?.message || '合并入库失败');
      }

      toast.success(
        '合并入库成功',
        `批次 ${pendingMerge.batchNumber} 已增加 ${pendingMerge.addQuantity}`
      );
      setIsMergeDialogOpen(false);
      setPendingMerge(null);
      // 刷新相关查询交由 hooks 的 onSuccess 处理
      handleCloseBatchForm();
    } catch (err) {
      toast.error(
        '合并入库失败',
        err instanceof Error ? err.message : '未知错误'
      );
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className='w-full max-w-none px-2 sm:px-4 lg:px-6 py-4 sm:py-6'>
      {isBatchMode && selectedMedicine ? (
        <>
          <div className='flex items-center mb-6'>
            <Button
              variant='outline'
              className='mr-4'
              onClick={handleBackToMedicines}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              返回药品列表
            </Button>
            <h1 className='text-3xl font-bold'>批次管理</h1>
          </div>

          <BatchList
            medicine={selectedMedicine}
            onAddBatch={handleAddBatch}
            onEditBatch={handleEditBatch}
            onDeleteBatch={handleDeleteBatch}
          />

          {selectedMedicine && (
            <BatchForm
              isOpen={isBatchFormOpen}
              onClose={handleCloseBatchForm}
              onSubmit={handleSubmitBatchForm}
              initialData={selectedBatch || undefined}
              medicine={selectedMedicine}
              isSubmitting={
                createBatchAndInbound.isPending || updateBatch.isPending
              }
            />
          )}

          <ConfirmDialog
            open={isDeleteBatchDialogOpen}
            onOpenChange={open => !open && handleCloseDeleteBatchDialog()}
            onConfirm={handleConfirmDeleteBatch}
            title='删除批次'
            description={`确定要删除批次 "${selectedBatch?.batch_number}" 吗？此操作不可撤销。`}
            loading={cascadeDeleteBatch.isPending}
          />

          <CascadeDeleteDialog
            isOpen={isBatchCascadeDeleteDialogOpen}
            onClose={handleCloseBatchCascadeDeleteDialog}
            onConfirm={handleConfirmBatchCascadeDelete}
            isLoading={cascadeDeleteBatch.isPending}
            title='删除批次'
            itemName={selectedBatch?.batch_number || ''}
            itemType='batch'
            dependencies={deleteDependencies}
          />
        </>
      ) : (
        <>
          <h1 className='text-3xl font-bold mb-6'>药品管理</h1>

          <MedicineList
            onAddMedicine={handleAddMedicine}
            onEditMedicine={handleEditMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onManageBatches={handleManageBatches}
          />

          <MedicineForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={handleSubmitForm}
            initialData={selectedMedicine || undefined}
            isSubmitting={createMedicine.isPending || updateMedicine.isPending}
          />

          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={open => !open && handleCloseDeleteDialog()}
            onConfirm={handleConfirmDelete}
            title='删除药品'
            description={`确定要删除药品 "${selectedMedicine?.name}" 吗？此操作不可撤销。`}
            loading={cascadeDeleteMedicine.isPending}
          />

          <CascadeDeleteDialog
            isOpen={isCascadeDeleteDialogOpen}
            onClose={handleCloseCascadeDeleteDialog}
            onConfirm={handleConfirmCascadeDelete}
            isLoading={cascadeDeleteMedicine.isPending}
            title='删除药品'
            itemName={selectedMedicine?.name || ''}
            itemType='medicine'
            dependencies={deleteDependencies}
          />
        </>
      )}

      {/* 合并入库确认对话框 */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认合并入库</DialogTitle>
            <DialogDescription>
              即将把新数量合并到已存在的批次中，请核对信息。
            </DialogDescription>
          </DialogHeader>
          {pendingMerge && (
            <div className='space-y-3 text-sm'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <div className='text-muted-foreground'>药品</div>
                  <div className='font-medium'>{selectedMedicine?.name}</div>
                </div>
                <div>
                  <div className='text-muted-foreground'>批次号</div>
                  <div className='font-medium'>{pendingMerge.batchNumber}</div>
                </div>
                <div>
                  <div className='text-muted-foreground'>生产日期</div>
                  <div className='font-medium'>
                    {new Date(pendingMerge.productionDate).toLocaleDateString(
                      'zh-CN'
                    )}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>有效期</div>
                  <div className='font-medium'>
                    {new Date(pendingMerge.expiryDate).toLocaleDateString(
                      'zh-CN'
                    )}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>当前库存</div>
                  <div className='font-medium'>
                    {pendingMerge.currentQuantity} {selectedMedicine?.unit}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>合并数量</div>
                  <div className='font-medium'>
                    +{pendingMerge.addQuantity} {selectedMedicine?.unit}
                  </div>
                </div>
              </div>
              <div className='text-sm text-muted-foreground'>
                合并后库存：
                <span className='font-medium text-foreground'>
                  {' '}
                  {pendingMerge.currentQuantity + pendingMerge.addQuantity}{' '}
                  {selectedMedicine?.unit}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsMergeDialogOpen(false)}
              disabled={isMerging}
            >
              取消
            </Button>
            <Button onClick={handleConfirmMerge} loading={isMerging}>
              确认合并
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
