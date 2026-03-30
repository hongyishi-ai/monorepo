/**
 * 用户管理相关的 React Hooks
 */

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/database';
import { userUtils } from '@/utils/supabase-utils';

export type UserRole = 'admin' | 'manager' | 'operator';

export interface UseUsersResult {
  users: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<boolean>;
}

/**
 * 获取用户列表的 Hook
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await userUtils.getAllUsers();
      setUsers(userData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '获取用户列表失败';
      setError(errorMessage);
      toast({
        title: '获取用户列表失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await userUtils.deleteUser(id);

        // 从本地状态中移除用户
        setUsers(prev => prev.filter(user => user.id !== id));

        toast({
          title: '删除成功',
          description: '用户已成功删除',
          variant: 'success',
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '删除用户失败';
        toast({
          title: '删除失败',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const toggleUserStatus = useCallback(
    async (id: string, currentStatus: boolean): Promise<boolean> => {
      try {
        const newStatus = !currentStatus;
        await userUtils.updateUser(id, { is_active: newStatus });

        // 更新本地状态
        setUsers(prev =>
          prev.map(user =>
            user.id === id ? { ...user, is_active: newStatus } : user
          )
        );

        toast({
          title: '状态更新成功',
          description: `用户已${newStatus ? '启用' : '禁用'}`,
          variant: 'success',
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '更新用户状态失败';
        toast({
          title: '状态更新失败',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
    deleteUser,
    toggleUserStatus,
  };
}

/**
 * 根据角色获取用户列表的 Hook
 */
export function useUsersByRole(role: UserRole): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await userUtils.getUsersByRole(role);
      setUsers(userData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '获取用户列表失败';
      setError(errorMessage);
      toast({
        title: '获取用户列表失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [role, toast]);

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await userUtils.deleteUser(id);
        setUsers(prev => prev.filter(user => user.id !== id));

        toast({
          title: '删除成功',
          description: '用户已成功删除',
          variant: 'success',
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '删除用户失败';
        toast({
          title: '删除失败',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  const toggleUserStatus = useCallback(
    async (id: string, currentStatus: boolean): Promise<boolean> => {
      try {
        const newStatus = !currentStatus;
        await userUtils.updateUser(id, { is_active: newStatus });

        setUsers(prev =>
          prev.map(user =>
            user.id === id ? { ...user, is_active: newStatus } : user
          )
        );

        toast({
          title: '状态更新成功',
          description: `用户已${newStatus ? '启用' : '禁用'}`,
          variant: 'success',
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '更新用户状态失败';
        toast({
          title: '状态更新失败',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
    deleteUser,
    toggleUserStatus,
  };
}
