/**
 * 审计日志页面
 * 显示系统操作的审计日志，支持筛选、搜索和导出
 */

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Download, Eye, Filter, RefreshCw, Search } from 'lucide-react';
import React, { useState } from 'react';

import { Calendar as UiCalendar } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/ui/StatsCard';
import {
  useActionTypeOptions,
  useAuditLogs,
  useAuditLogStats,
  useExportAuditLogs,
  useTableNameOptions,
} from '@/hooks/use-audit-logs';
import {
  AuditLogsService,
  type AuditLogFilters,
} from '@/services/audit-logs.service';

export const AuditLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    pageSize: 20,
  });

  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);

  const {
    data: auditLogsData,
    isLoading,
    error,
    refetch,
  } = useAuditLogs(filters);
  const { data: stats, isLoading: statsLoading } = useAuditLogStats();
  const exportMutation = useExportAuditLogs();

  const actionTypeOptions = useActionTypeOptions();
  const tableNameOptions = useTableNameOptions();

  // 处理筛选条件变化
  const handleFilterChange = (
    key: keyof AuditLogFilters,
    value: string | number | undefined
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 重置到第一页
    }));
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // 处理导出
  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  // 格式化JSON数据显示
  const formatJsonData = (data: Record<string, unknown> | null): string => {
    if (!data) return '无数据';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // 获取操作类型的颜色
  const getActionTypeColor = (
    actionType: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (actionType.includes('delete')) return 'destructive';
    if (actionType.includes('create')) return 'default';
    if (actionType.includes('update')) return 'secondary';
    if (actionType.includes('transaction')) return 'outline';
    return 'default';
  };

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>加载审计日志失败</p>
          <Button onClick={() => refetch()} variant='outline'>
            <RefreshCw className='w-4 h-4 mr-2' />
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 统计卡片 - 统一 StatsCard 风格 */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <StatsCard
          title='总日志数'
          value={
            statsLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.totalLogs.toLocaleString()
            )
          }
        />
        <StatsCard
          title='今日日志'
          value={
            statsLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.todayLogs.toLocaleString()
            )
          }
        />
        <StatsCard
          title='活跃用户'
          value={
            statsLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.userStats.length || 0
            )
          }
        />
        <StatsCard
          title='操作类型'
          value={
            statsLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              stats?.actionTypeStats.length || 0
            )
          }
        />
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='w-5 h-5' />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='search'>搜索</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  id='search'
                  placeholder='搜索用户、操作等...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>操作类型</Label>
              <Select
                value={filters.actionType || ''}
                onValueChange={value =>
                  handleFilterChange('actionType', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择操作类型' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>全部</SelectItem>
                  {actionTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>表名</Label>
              <Select
                value={filters.tableName || ''}
                onValueChange={value =>
                  handleFilterChange('tableName', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择表名' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>全部</SelectItem>
                  {tableNameOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='startDate'>开始日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {filters.startDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <UiCalendar
                    value={filters.startDate || ''}
                    onChange={value => handleFilterChange('startDate', value)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className='flex justify-between items-center mt-4'>
            <div className='flex gap-2'>
              <Button
                onClick={() => setFilters({ page: 1, pageSize: 20 })}
                variant='outline'
                size='sm'
              >
                清除筛选
              </Button>
              <Button
                onClick={() => refetch()}
                variant='outline'
                size='sm'
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                刷新
              </Button>
            </div>

            <Button
              onClick={handleExport}
              variant='outline'
              size='sm'
              disabled={exportMutation.isPending}
            >
              <Download className='w-4 h-4 mr-2' />
              {exportMutation.isPending ? '导出中...' : '导出'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 审计日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>审计日志</CardTitle>
          <CardDescription>
            {auditLogsData &&
              `共 ${auditLogsData.total} 条记录，第 ${auditLogsData.page} 页`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4' />
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogsData?.data.length === 0 ? (
            <div className='py-10 flex items-center justify-center'>
              <div className='text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8'>
                <div className='mx-auto mb-3 h-8 w-8 rounded-full bg-slate-200' />
                <p className='text-sm text-slate-600'>
                  没有找到符合条件的审计日志
                </p>
                <p className='text-xs text-slate-500 mt-1'>
                  尝试更换筛选条件或清除筛选
                </p>
                <div className='mt-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setFilters({ page: 1, pageSize: 20 })}
                  >
                    清除筛选
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {auditLogsData?.data.map(log => (
                <div
                  key={log.id}
                  className='flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50'
                >
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <Badge variant={getActionTypeColor(log.action_type)}>
                        {AuditLogsService.formatActionType(log.action_type)}
                      </Badge>
                      <span className='text-sm text-gray-600'>
                        {AuditLogsService.formatTableName(log.table_name)}
                      </span>
                      <span className='text-sm text-gray-400'>
                        {format(
                          new Date(log.created_at),
                          'yyyy-MM-dd HH:mm:ss',
                          { locale: zhCN }
                        )}
                      </span>
                    </div>

                    <div className='text-sm'>
                      <span className='font-medium'>{log.user_name}</span>
                      <span className='text-gray-600 ml-2'>
                        ({log.user_email})
                      </span>
                    </div>

                    {log.ip_address && (
                      <div className='text-xs text-gray-500'>
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => console.log('查看详情:', log)}
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        详情
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-4xl max-h-[80vh]'>
                      <DialogHeader>
                        <DialogTitle>审计日志详情</DialogTitle>
                        <DialogDescription>
                          {format(
                            new Date(log.created_at),
                            'yyyy年MM月dd日 HH:mm:ss',
                            { locale: zhCN }
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className='max-h-[60vh]'>
                        <div className='space-y-4'>
                          <div className='grid grid-cols-2 gap-4'>
                            <div>
                              <Label className='text-sm font-medium'>
                                操作用户
                              </Label>
                              <p className='text-sm'>
                                {log.user_name} ({log.user_email})
                              </p>
                            </div>
                            <div>
                              <Label className='text-sm font-medium'>
                                操作类型
                              </Label>
                              <p className='text-sm'>
                                <Badge
                                  variant={getActionTypeColor(log.action_type)}
                                >
                                  {AuditLogsService.formatActionType(
                                    log.action_type
                                  )}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <Label className='text-sm font-medium'>
                                表名
                              </Label>
                              <p className='text-sm'>
                                {AuditLogsService.formatTableName(
                                  log.table_name
                                )}
                              </p>
                            </div>
                            <div>
                              <Label className='text-sm font-medium'>
                                记录ID
                              </Label>
                              <p className='text-sm font-mono'>
                                {log.record_id}
                              </p>
                            </div>
                            {log.ip_address && (
                              <div>
                                <Label className='text-sm font-medium'>
                                  IP地址
                                </Label>
                                <p className='text-sm'>{log.ip_address}</p>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {log.old_values && (
                            <div>
                              <Label className='text-sm font-medium'>
                                修改前数据
                              </Label>
                              <pre className='text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto'>
                                {formatJsonData(log.old_values)}
                              </pre>
                            </div>
                          )}

                          {log.new_values && (
                            <div>
                              <Label className='text-sm font-medium'>
                                修改后数据
                              </Label>
                              <pre className='text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto'>
                                {formatJsonData(log.new_values)}
                              </pre>
                            </div>
                          )}

                          {log.user_agent && (
                            <div>
                              <Label className='text-sm font-medium'>
                                用户代理
                              </Label>
                              <p className='text-xs text-gray-600 break-all'>
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {auditLogsData && auditLogsData.totalPages > 1 && (
            <div className='flex justify-center items-center gap-2 mt-6'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(auditLogsData.page - 1)}
                disabled={auditLogsData.page <= 1}
              >
                上一页
              </Button>

              <span className='text-sm text-gray-600'>
                第 {auditLogsData.page} 页，共 {auditLogsData.totalPages} 页
              </span>

              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(auditLogsData.page + 1)}
                disabled={auditLogsData.page >= auditLogsData.totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
