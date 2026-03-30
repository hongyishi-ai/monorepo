/**
 * 用户列表组件
 * 显示系统中的所有用户
 */

import { Edit, Mail, Search, Trash2, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/use-users';
import type { AuthUser, UserRole } from '@/types/auth';
import { canManageRole, getUserRoleLabel } from '@/utils/auth-utils';

interface UserListProps {
  onEditUser: (user: AuthUser) => void;
  currentUser: AuthUser | null;
}

export function UserList({ onEditUser, currentUser }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // 使用真实的用户数据
  const { users, isLoading, error, refetch, deleteUser, toggleUserStatus } =
    useUsers();

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      await deleteUser(userId);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    await toggleUserStatus(userId, isActive);
  };

  // 导出功能
  const handleExportUsers = (format: 'csv' | 'excel') => {
    try {
      if (!filteredUsers || filteredUsers.length === 0) {
        alert('没有数据可导出');
        return;
      }

      const exportData = filteredUsers.map(user => ({
        name: user.name,
        email: user.email,
        role: getUserRoleLabel(user.role),
        is_active: user.is_active ? '启用' : '禁用',
        last_login_at: user.last_login
          ? new Date(user.last_login).toLocaleDateString('zh-CN')
          : '从未登录',
        created_at: new Date(user.created_at).toLocaleDateString('zh-CN'),
        updated_at: new Date(user.updated_at).toLocaleDateString('zh-CN'),
      }));

      const headers = {
        name: '用户姓名',
        email: '邮箱地址',
        role: '角色',
        is_active: '状态',
        last_login_at: '最后登录',
        created_at: '创建时间',
        updated_at: '更新时间',
      };

      if (format === 'csv') {
        const csvContent = [
          Object.values(headers).join(','),
          ...exportData.map(row => Object.values(row).join(',')),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `用户列表_${new Date().toLocaleDateString('zh-CN')}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Excel导出功能将在后续版本实现');
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'operator':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className='space-y-4'>
        <div className='text-center py-8'>
          <p className='text-red-600 mb-4'>加载用户列表失败: {error}</p>
          <Button onClick={refetch} variant='outline'>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 搜索和筛选 */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='搜索用户姓名或邮箱...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className='px-3 py-2 border border-gray-300 rounded-md text-sm'
        >
          <option value='all'>所有角色</option>
          <option value='admin'>系统管理员</option>
          <option value='manager'>库存经理</option>
          <option value='operator'>操作员</option>
        </select>

        {/* 导出按钮 */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handleExportUsers('csv')}
          className='flex items-center gap-1'
          title='导出CSV'
        >
          <span className='text-xs'>📄</span>
          <span className='hidden sm:inline text-xs'>CSV</span>
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => handleExportUsers('excel')}
          className='flex items-center gap-1'
          title='导出Excel'
        >
          <span className='text-xs'>📊</span>
          <span className='hidden sm:inline text-xs'>Excel</span>
        </Button>

        <Button
          onClick={refetch}
          variant='outline'
          size='sm'
          disabled={isLoading}
        >
          刷新
        </Button>
      </div>

      {/* 用户列表 */}
      <div className='bg-white rounded-lg border'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  用户信息
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  角色
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  状态
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  最后登录
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  创建时间
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {isLoading ? (
                // 加载状态
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <Skeleton className='h-10 w-10 rounded-full' />
                        <div className='ml-4'>
                          <Skeleton className='h-4 w-24 mb-1' />
                          <Skeleton className='h-3 w-32' />
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Skeleton className='h-6 w-16' />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Skeleton className='h-6 w-12' />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Skeleton className='h-4 w-20' />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Skeleton className='h-4 w-20' />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex space-x-2'>
                        <Skeleton className='h-8 w-8' />
                        <Skeleton className='h-8 w-12' />
                        <Skeleton className='h-8 w-8' />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                // 空状态
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-8 text-center text-gray-500'
                  >
                    {searchTerm || selectedRole !== 'all'
                      ? '没有找到匹配的用户'
                      : '暂无用户数据'}
                  </td>
                </tr>
              ) : (
                // 用户列表
                filteredUsers.map(user => (
                  <tr key={user.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10'>
                          <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                            <UserIcon className='h-5 w-5 text-gray-500' />
                          </div>
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {user.name}
                            {user.id === currentUser?.id && (
                              <Badge variant='outline' className='ml-2'>
                                当前用户
                              </Badge>
                            )}
                          </div>
                          <div className='text-sm text-gray-500 flex items-center'>
                            <Mail className='h-3 w-3 mr-1' />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getUserRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? '活跃' : '禁用'}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {user.last_login
                        ? formatDate(user.last_login)
                        : '从未登录'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {formatDate(user.created_at)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex items-center justify-end space-x-2'>
                        {/* 只有当前用户可以管理目标用户时才显示操作按钮 */}
                        {currentUser?.role &&
                          canManageRole(currentUser.role, user.role) && (
                            <>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  onEditUser({
                                    ...user,
                                    app_metadata: {},
                                    user_metadata: {},
                                    aud: 'authenticated',
                                    profile: {
                                      id: user.id,
                                      name: user.name,
                                      email: user.email,
                                      role: user.role,
                                      created_at: user.created_at,
                                      updated_at: user.updated_at,
                                      is_active: user.is_active,
                                      last_login: user.last_login,
                                    },
                                  } as AuthUser)
                                }
                                className='text-blue-600 hover:text-blue-700'
                              >
                                <Edit className='h-4 w-4' />
                              </Button>

                              {user.id !== currentUser?.id && (
                                <>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleToggleUserStatus(
                                        user.id,
                                        user.is_active
                                      )
                                    }
                                    className={
                                      user.is_active
                                        ? 'text-orange-600 hover:text-orange-700'
                                        : 'text-green-600 hover:text-green-700'
                                    }
                                  >
                                    {user.is_active ? '禁用' : '启用'}
                                  </Button>

                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteUser(user.id)}
                                    className='text-red-600 hover:text-red-700'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </>
                              )}
                            </>
                          )}

                        {/* 如果没有管理权限，显示提示 */}
                        {(!currentUser?.role ||
                          !canManageRole(currentUser.role, user.role)) && (
                          <span className='text-xs text-gray-400'>无权限</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
