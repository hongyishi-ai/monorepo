/**
 * 药品搜索卡片组件
 * 用于显示通过搜索选中的药品信息
 */

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Medicine } from '@/types/database';

interface MedicineSearchCardProps {
  medicine: Medicine;
  onClear: () => void;
  title?: string;
}

export function MedicineSearchCard({
  medicine,
  onClear,
  title = '已选择药品',
}: MedicineSearchCardProps) {
  return (
    <Card className='shadow-sm border-blue-200 bg-blue-50/30'>
      <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base sm:text-lg text-blue-800'>
            {title}
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClear}
            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='px-4 sm:px-6 space-y-3'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-gray-500'>条码:</span>
            <span className='ml-2 font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded'>
              {medicine.barcode}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>名称:</span>
            <span className='ml-2 font-semibold text-gray-900'>
              {medicine.name}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>规格:</span>
            <span className='ml-2 text-gray-700'>
              {medicine.specification || '-'}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>厂家:</span>
            <span className='ml-2 text-gray-700'>
              {medicine.manufacturer || '-'}
            </span>
          </div>
          {medicine.shelf_location && (
            <div className='sm:col-span-2'>
              <span className='text-gray-500'>货架位置:</span>
              <span className='ml-2 text-gray-700'>
                {medicine.shelf_location}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
