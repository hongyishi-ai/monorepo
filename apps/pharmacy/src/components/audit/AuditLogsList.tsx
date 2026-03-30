import { Eye, Filter, Shield, User } from 'lucide-react';
import { useState } from 'react';

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
// import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type AuditLogFilters,
  actionTypeLabels,
  getActionTypeLabel,
  getRoleLabel,
  useAuditLogs,
} from '@/hooks/use-audit-logs';
import { formatDateTime } from '@/lib/utils';
import type { AuditLogWithUser } from '@/services/audit-logs.service';

export function AuditLogsList() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    pageSize: 50,
    page: 1,
  });

  const { data: auditLogs, isLoading, error, refetch } = useAuditLogs(filters);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev: AuditLogFilters) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // 重置分页
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      pageSize: 50,
      page: 1,
    });
  };

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes('create')) return 'default';
    if (actionType.includes('update')) return 'secondary';
    if (actionType.includes('delete')) return 'destructive';
    if (actionType.includes('inbound')) return 'default';
    if (actionType.includes('outbound')) return 'outline';
    if (actionType.includes('reverse')) return 'destructive';
    return 'secondary';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'pharmacist':
        return 'default';
      case 'operator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-500'>
            加载失败: {error instanceof Error ? error.message : '未知错误'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          操作审计日志
        </CardTitle>
        <CardDescription>
          记录所有用户的操作行为，确保系统安全和可追溯性
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 过滤器 */}
        <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-2 mb-4'>
            <Filter className='h-4 w-4' />
            <span className='font-medium'>过滤条件</span>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='action-type'>操作类型</Label>
              <Select
                value={filters.actionType || ''}
                onValueChange={value => handleFilterChange('actionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择操作类型' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>全部</SelectItem>
                  {Object.entries(actionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='target-type'>目标类型</Label>
              <Select
                value={filters.tableName || ''}
                onValueChange={value => handleFilterChange('tableName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择目标类型' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>全部</SelectItem>
                  <SelectItem value='medicine'>药品</SelectItem>
                  <SelectItem value='batch'>批次</SelectItem>
                  <SelectItem value='inventory_transaction'>
                    库存交易
                  </SelectItem>
                  <SelectItem value='user'>用户</SelectItem>
                  <SelectItem value='system'>系统</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='start-date'>开始日期</Label>
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

            <div className='space-y-2'>
              <Label htmlFor='end-date'>结束日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {filters.endDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <UiCalendar
                    value={filters.endDate || ''}
                    onChange={value => handleFilterChange('endDate', value)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className='flex gap-2 mt-4'>
            <Button size='sm' onClick={() => refetch()}>
              <Filter className='h-3 w-3 mr-1' />
              应用过滤
            </Button>
            <Button size='sm' variant='outline' onClick={handleClearFilters}>
              清除过滤
            </Button>
          </div>
        </div>

        {/* 日志列表 */}
        {!auditLogs?.data || auditLogs.data.length === 0 ? (
          <EmptyState
            icon={<Shield className='h-10 w-10' />}
            title='暂无审计日志'
            description='调整筛选条件或更换日期范围试试'
            action={
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                重新加载
              </Button>
            }
          />
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>目标</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.data.map((log: AuditLogWithUser) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className='text-sm'>
                        {formatDateTime(log.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <User className='h-3 w-3 text-gray-400' />
                        <div>
                          <div className='font-medium text-sm'>
                            {log.user_name}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {log.user_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(log.user_role)}>
                        {getRoleLabel(log.user_role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {getActionTypeLabel(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {log.target_name && (
                          <div className='font-medium'>{log.target_name}</div>
                        )}
                        {log.target_type && (
                          <div className='text-xs text-gray-500'>
                            {log.target_type}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm max-w-xs truncate'>
                        {log.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size='sm' variant='ghost'>
                        <Eye className='h-3 w-3' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
