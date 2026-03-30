/**
 * 用户管理页面组件
 * 管理员功能：管理系统用户和权限
 */

import { Shield, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

import { UserForm } from '@/components/auth/UserForm';
import { UserList } from '@/components/auth/UserList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
// 使用旧认证系统
import type { AuthUser } from '@/types/auth';
import { getAllRoles, getManageableRoles, hasRole } from '@/utils/auth-utils';

export function UserManagementPage() {
  // 使用旧认证系统获取认证状态
  const { user } = useAuthStore();

  // 开发环境调试信息
  if (import.meta.env.DEV) {
    console.log('👥 UserManagementPage 认证状态:', {
      user: user?.email,
      role: user?.role,
      isAdmin: hasRole(user, 'admin'),
      isManager: hasRole(user, 'manager'),
    });
  }
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // 检查用户是否有管理权限
  if (user?.role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md'>
          <div className='mb-4'>
            <Shield className='mx-auto w-16 h-16 text-red-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>访问被拒绝</h1>
          <p className='text-gray-600 mb-6'>
            只有系统管理员才能访问用户管理页面。
          </p>
          <Button onClick={() => window.history.back()}>返回上一页</Button>
        </div>
      </div>
    );
  }

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: AuthUser) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserSaved = () => {
    setShowUserForm(false);
    setEditingUser(null);
    // 这里可以添加刷新用户列表的逻辑
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 页面头部 */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-3'>
              <Users className='h-6 w-6 text-blue-600' />
              <h1 className='text-xl font-semibold text-gray-900'>用户管理</h1>
            </div>

            <Button
              onClick={handleAddUser}
              className='flex items-center space-x-2'
            >
              <UserPlus className='h-4 w-4' />
              <span>添加用户</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 统计卡片 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>总用户数</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>12</div>
              <p className='text-xs text-muted-foreground'>活跃用户</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>管理员</CardTitle>
              <Shield className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>2</div>
              <p className='text-xs text-muted-foreground'>系统管理员</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>操作员</CardTitle>
              <Users className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>8</div>
              <p className='text-xs text-muted-foreground'>日常操作人员</p>
            </CardContent>
          </Card>
        </div>

        {/* 权限说明 */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>角色权限说明</CardTitle>
            <CardDescription>不同角色的权限范围和职责</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {getAllRoles().map(role => (
                <div key={role.value} className='p-4 border rounded-lg'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <Badge
                      variant={
                        role.value === 'admin'
                          ? 'destructive'
                          : role.value === 'manager'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {role.label}
                    </Badge>
                  </div>
                  <p className='text-sm text-gray-600'>{role.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>管理系统中的所有用户账户</CardDescription>
          </CardHeader>
          <CardContent>
            <UserList onEditUser={handleEditUser} currentUser={user} />
          </CardContent>
        </Card>
      </div>

      {/* 用户表单弹窗 */}
      {showUserForm && (
        <UserForm
          user={editingUser || undefined}
          onClose={handleCloseForm}
          onSaved={handleUserSaved}
          manageableRoles={getManageableRoles(user?.role || 'operator')}
        />
      )}
    </div>
  );
}

export default UserManagementPage;
