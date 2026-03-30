import { InventoryOperationPage as InventoryOperationComponent } from '@/components/scanner/InventoryOperationPage';

/**
 * 统一的出/入库操作页面
 * 合并了原来的入库和出库页面功能
 */
export function InventoryOperationPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-foreground'>出/入库操作</h1>
          <p className='text-muted-foreground mt-2'>
            统一的药品出库和入库操作界面，支持扫码和手动输入
          </p>
        </div>

        <InventoryOperationComponent />
      </div>
    </div>
  );
}

export default InventoryOperationPage;
