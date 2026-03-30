/**
 * 撤回统计卡片组件
 * 显示撤回操作的统计信息
 */

import { AlertTriangle, CheckCircle, Clock, Undo2 } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyUndoStats } from '@/hooks/use-undo-transaction';

export const UndoStatsCard: React.FC = () => {
  const { data: stats, isLoading, error } = useMyUndoStats();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='w-5 h-5' />
            加载失败
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-gray-600'>无法加载撤回统计信息</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>可撤回交易</CardTitle>
          <Undo2 className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.totalUndoable || 0
            )}
          </div>
          <p className='text-xs text-muted-foreground'>
            24小时内可撤回的出库操作
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>即将过期</CardTitle>
          <Clock className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold flex items-center gap-2'>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <>
                {stats?.expiringSoon || 0}
                {stats && stats.expiringSoon > 0 && (
                  <Badge variant='warning' className='text-xs'>
                    紧急
                  </Badge>
                )}
              </>
            )}
          </div>
          <p className='text-xs text-muted-foreground'>2小时内过期的撤回权限</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>今日已撤回</CardTitle>
          <CheckCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.undoneToday || 0
            )}
          </div>
          <p className='text-xs text-muted-foreground'>今天已执行的撤回操作</p>
        </CardContent>
      </Card>
    </div>
  );
};
