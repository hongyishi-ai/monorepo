/**
 * 库存不足提醒组件
 * 显示库存不足的药品列表和统计信息
 */

import { AlertCircle, ChevronRight, Package, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LowStockMedicine } from '@/hooks/use-low-stock';
import { useLowStock } from '@/hooks/use-low-stock';
import { useAuthStore } from '@/stores/auth.store';

interface LowStockWarningsProps {
  limit?: number;
  showSettings?: boolean;
  showViewAll?: boolean;
}

export function LowStockWarnings({
  limit = 5,
  showSettings = true,
  showViewAll = true,
}: LowStockWarningsProps) {
  const { user } = useAuthStore();
  const {
    lowStockMedicines,
    stats,
    lowStockThreshold,
    isLoading,
    updateLowStockThreshold,
    isUpdatingThreshold,
  } = useLowStock();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState(
    lowStockThreshold.toString()
  );

  const isAdmin = user?.role === 'admin';
  const limitedMedicines = lowStockMedicines.slice(0, limit);

  const handleUpdateThreshold = () => {
    const threshold = parseInt(newThreshold, 10);
    if (!isNaN(threshold) && threshold > 0) {
      updateLowStockThreshold(threshold);
      setIsSettingsOpen(false);
    }
  };

  const getStatusBadge = (medicine: LowStockMedicine) => {
    if (medicine.total_quantity === 0) {
      return <Badge variant='destructive'>缺货</Badge>;
    } else if (medicine.shortage >= medicine.safety_stock * 0.8) {
      return <Badge variant='destructive'>严重</Badge>;
    } else if (medicine.shortage >= medicine.safety_stock * 0.5) {
      return (
        <Badge variant='warning' className='bg-orange-500'>
          警告
        </Badge>
      );
    } else {
      return <Badge variant='outline'>注意</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <div>
          <CardTitle className='text-lg font-medium'>库存不足药品</CardTitle>
          <CardDescription>
            {isLoading ? '加载中...' : `共 ${stats.total} 种药品库存不足`}
          </CardDescription>
        </div>
        <AlertCircle className='h-5 w-5 text-red-500' />
      </CardHeader>

      <CardContent className='pt-4'>
        {isLoading ? (
          <div className='flex justify-center py-6'>
            <div className='animate-pulse flex space-x-4'>
              <div className='flex-1 space-y-4 py-1'>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                <div className='space-y-2'>
                  <div className='h-4 bg-gray-200 rounded'></div>
                  <div className='h-4 bg-gray-200 rounded w-5/6'></div>
                </div>
              </div>
            </div>
          </div>
        ) : lowStockMedicines.length === 0 ? (
          <EmptyState
            icon={<Package className='h-10 w-10' />}
            title='没有库存不足药品'
            description='当前所有药品库存均高于安全库存'
          />
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-between text-sm mb-2'>
              <div className='flex space-x-2'>
                {stats.outOfStock > 0 && (
                  <Badge variant='destructive'>{stats.outOfStock} 缺货</Badge>
                )}
                {stats.critical > 0 && (
                  <Badge variant='destructive'>{stats.critical} 严重</Badge>
                )}
                {stats.warning > 0 && (
                  <Badge variant='warning' className='bg-orange-500'>
                    {stats.warning} 警告
                  </Badge>
                )}
              </div>
            </div>

            <div className='space-y-3'>
              {limitedMedicines.map(medicine => (
                <div
                  key={medicine.id}
                  className='flex items-center justify-between p-2 rounded-md border border-gray-100 hover:bg-gray-50'
                >
                  <div className='flex-1'>
                    <div className='flex items-center'>
                      <span className='font-medium'>{medicine.name}</span>
                      <span className='ml-2'>{getStatusBadge(medicine)}</span>
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      <span>
                        安全库存: {medicine.safety_stock} {medicine.unit}
                      </span>
                      <span className='mx-2'>|</span>
                      <span>
                        当前库存: {medicine.total_quantity} {medicine.unit}
                      </span>
                      <span className='mx-2'>|</span>
                      <span className='text-red-500'>
                        缺少: {medicine.shortage} {medicine.unit}
                      </span>
                    </div>
                  </div>
                  <div className='text-sm font-medium'>
                    {medicine.safety_stock > 0
                      ? `${Math.round(
                          (medicine.shortage / medicine.safety_stock) * 100
                        )}%`
                      : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className='flex justify-between pt-2'>
        {showViewAll && (
          <Button variant='outline' size='sm' asChild>
            <Link to='/reports?tab=lowstock'>
              查看全部
              <ChevronRight className='h-4 w-4 ml-1' />
            </Link>
          </Button>
        )}

        {showSettings && isAdmin && (
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant='ghost' size='sm'>
                <Settings className='h-4 w-4 mr-1' />
                设置
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>库存不足提醒设置</DialogTitle>
                <DialogDescription>设置库存不足提醒阈值</DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='threshold' className='text-right'>
                    提醒阈值
                  </Label>
                  <div className='col-span-3 flex items-center'>
                    <Input
                      id='threshold'
                      type='number'
                      min='1'
                      max='1000'
                      value={newThreshold}
                      onChange={e => setNewThreshold(e.target.value)}
                      className='w-20'
                    />
                    <span className='ml-2'>件</span>
                  </div>
                </div>
                <div className='text-sm text-gray-500 col-start-2 col-span-3'>
                  当药品库存低于安全库存时，系统将显示提醒
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsSettingsOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleUpdateThreshold}
                  disabled={isUpdatingThreshold}
                >
                  {isUpdatingThreshold ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
