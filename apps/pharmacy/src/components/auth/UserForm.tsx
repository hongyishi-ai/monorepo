/**
 * 用户表单组件
 * 用于添加和编辑用户信息
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInputWithStrength } from '@/components/ui/password-strength-indicator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
// 使用旧认证系统
import type { AuthUser, UserRole } from '@/types/auth';
import {
  validatePassword,
  type PasswordValidationResult,
} from '@/utils/password-validator';
import { userUtils } from '@/utils/supabase-utils';

// 用户表单验证 Schema
const userSchema = z.object({
  name: z
    .string()
    .min(1, '请输入用户姓名')
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
  role: z.enum(['admin', 'manager', 'operator'], {
    message: '请选择用户角色',
  }),
  password: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true; // 编辑时密码可选
      return val.length >= 12;
    }, '密码至少需要12位字符'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: AuthUser; // 编辑时的用户数据
  onClose: () => void;
  onSaved: () => void;
  manageableRoles: UserRole[];
}

export function UserForm({
  user,
  onClose,
  onSaved,
  manageableRoles,
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidationResult | null>(null);
  // 使用旧认证系统获取认证操作
  const { signUp } = useAuthStore();
  const { toast } = useToast();

  const isEditing = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.profile?.name || '',
      email: user?.email || '',
      role: user?.role || 'operator',
      password: '',
    },
  });

  // 监听角色变化，确保只能选择可管理的角色
  const selectedRole = form.watch('role');
  console.log('Selected role:', selectedRole); // 使用selectedRole避免未使用警告

  useEffect(() => {
    if (user) {
      form.setValue('name', user.profile?.name || '');
      form.setValue('email', user.email || '');
      form.setValue('role', user.role || 'operator');
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing) {
        // 更新用户逻辑
        if (!user?.id) {
          setError('用户ID不存在');
          return;
        }

        await userUtils.updateUser(user.id, {
          name: data.name,
          email: data.email,
          role: data.role,
        });

        toast({
          title: '更新成功',
          description: '用户信息已成功更新',
          variant: 'success',
        });
      } else {
        // 创建新用户
        if (!data.password) {
          setError('创建新用户时密码不能为空');
          return;
        }

        // 验证密码强度
        const passwordValidationResult = await validatePassword(data.password);
        if (!passwordValidationResult.isValid) {
          setError(
            `密码不符合安全要求: ${passwordValidationResult.feedback.join(', ')}`
          );
          return;
        }

        await signUp({
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
        });

        toast({
          title: '创建成功',
          description: '用户已成功创建',
          variant: 'success',
        });
      }

      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <User className='h-5 w-5' />
            <span>{isEditing ? '编辑用户' : '添加用户'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '修改用户信息和权限' : '创建新的系统用户账户'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant='destructive'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>{error}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setError(null)}
                className='h-auto p-1 text-destructive hover:text-destructive/80'
              >
                ×
              </Button>
            </div>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    用户姓名 <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入用户姓名'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    邮箱地址 <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='请输入邮箱地址'
                      disabled={isSubmitting || isEditing} // 编辑时不允许修改邮箱
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {isEditing && (
                    <p className='text-xs text-gray-500'>邮箱地址不能修改</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    用户角色 <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='请选择用户角色' />
                      </SelectTrigger>
                      <SelectContent>
                        {manageableRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role === 'admin'
                              ? '系统管理员'
                              : role === 'manager'
                                ? '库存经理'
                                : '操作员'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      初始密码 <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <PasswordInputWithStrength
                        label=''
                        placeholder='请输入初始密码'
                        value={field.value || ''}
                        onChange={field.onChange}
                        onValidationChange={setPasswordValidation}
                        showRequirements={true}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className='text-xs text-gray-500'>
                      用户首次登录后可以修改密码
                    </p>
                  </FormItem>
                )}
              />
            )}

            <div className='flex justify-end space-x-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type='submit'
                disabled={
                  isSubmitting ||
                  (!isEditing &&
                    passwordValidation !== null &&
                    !passwordValidation.isValid)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {isEditing ? '保存中...' : '创建中...'}
                  </>
                ) : isEditing ? (
                  '保存'
                ) : (
                  '创建用户'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
