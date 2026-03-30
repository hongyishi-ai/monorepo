/**
 * 近效期药品提醒组件
 * 显示即将过期的药品列表和统计信息
 */

import { AlertTriangle, Calendar, ChevronRight, Settings } from 'lucide-react';
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
import { useExpiryWarnings } from '@/hooks/use-expiry-warnings';
import { useAuthStore } from '@/stores/auth.store';

interface ExpiryWarningsProps {
  limit?: number;
  showSettings?: boolean;
  showViewAll?: boolean;
}

export function ExpiryWarnings({
  limit = 5,
  showSettings = true,
  showViewAll = true,
}: ExpiryWarningsProps) {
  const { user } = useAuthStore();
  const {
    expiringMedicines,
    stats,
    warningThreshold,
    isLoading,
    updateWarningThreshold,
    isUpdatingThreshold,
  } = useExpiryWarnings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState(warningThreshold.toString());

  const isAdmin = user?.role === 'admin';
  const limitedMedicines = expiringMedicines.slice(0, limit);

  const handleUpdateThreshold = () => {
    const days = parseInt(newThreshold, 10);
    if (!isNaN(days) && days > 0) {
      updateWarningThreshold(days);
      setIsSettingsOpen(false);
    }
  };

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return <Badge variant='destructive'>已过期</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant='destructive'>紧急</Badge>;
    } else if (daysLeft <= 15) {
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
          <CardTitle className='text-lg font-medium'>近效期药品</CardTitle>
          <CardDescription>
            {isLoading ? '加载中...' : `共 ${stats.total} 种药品即将过期`}
          </CardDescription>
        </div>
        <AlertTriangle className='h-5 w-5 text-orange-500' />
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
        ) : expiringMedicines.length === 0 ? (
          <EmptyState
            icon={<Calendar className='h-10 w-10' />}
            title='没有近效期药品'
            description='当前没有需要处理的近效期药品'
          />
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-between text-sm mb-2'>
              <div className='flex space-x-2'>
                {stats.expired > 0 && (
                  <Badge variant='destructive'>{stats.expired} 已过期</Badge>
                )}
                {stats.critical > 0 && (
                  <Badge variant='destructive'>{stats.critical} 紧急</Badge>
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
                  key={medicine.batch_id}
                  className='flex items-center justify-between p-2 rounded-md border border-gray-100 hover:bg-gray-50'
                >
                  <div className='flex-1'>
                    <div className='flex items-center'>
                      <span className='font-medium'>
                        {medicine.medicine_name}
                      </span>
                      <span className='ml-2'>
                        {getStatusBadge(medicine.days_until_expiry)}
                      </span>
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      <span>批次: {medicine.batch_number}</span>
                      <span className='mx-2'>|</span>
                      <span>
                        {medicine.days_until_expiry <= 0
                          ? `已过期 ${Math.abs(medicine.days_until_expiry)} 天`
                          : `剩余 ${medicine.days_until_expiry} 天`}
                      </span>
                    </div>
                  </div>
                  <div className='text-sm font-medium'>
                    {medicine.quantity} 件
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
            <Link to='/reports?tab=expiry'>
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
                <DialogTitle>近效期提醒设置</DialogTitle>
                <DialogDescription>
                  设置药品过期前多少天开始提醒
                </DialogDescription>
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
                      max='180'
                      value={newThreshold}
                      onChange={e => setNewThreshold(e.target.value)}
                      className='w-20'
                    />
                    <span className='ml-2'>天</span>
                  </div>
                </div>
                <div className='text-sm text-gray-500 col-start-2 col-span-3'>
                  当药品距离过期日期小于等于此天数时，系统将显示提醒
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
