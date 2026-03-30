/**
 * 密码策略设置组件
 * 允许管理员配置密码安全要求
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';

// 密码策略设置 Schema
const passwordPolicySchema = z.object({
  minLength: z
    .number()
    .min(8, '最小长度不能少于8位')
    .max(128, '最大长度不能超过128位'),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSymbols: z.boolean(),
  checkLeaked: z.boolean(),
});

type PasswordPolicyFormData = z.infer<typeof passwordPolicySchema>;

export function PasswordPolicySettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<PasswordPolicyFormData>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      checkLeaked: true,
    },
  });

  // 加载当前密码策略设置
  useEffect(() => {
    const loadPasswordPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.systemSettings)
          .select('key, value')
          .in('key', [
            'PASSWORD_MIN_LENGTH',
            'PASSWORD_REQUIRE_UPPERCASE',
            'PASSWORD_REQUIRE_LOWERCASE',
            'PASSWORD_REQUIRE_NUMBERS',
            'PASSWORD_REQUIRE_SYMBOLS',
            'PASSWORD_CHECK_LEAKED',
          ]);

        if (error) throw error;

        // 将设置转换为表单数据
        const settings =
          data?.reduce(
            (acc, setting) => {
              acc[setting.key] = setting.value;
              return acc;
            },
            {} as Record<string, string>
          ) || {};

        form.setValue(
          'minLength',
          parseInt(settings.PASSWORD_MIN_LENGTH || '12', 10)
        );
        form.setValue(
          'requireUppercase',
          settings.PASSWORD_REQUIRE_UPPERCASE === 'true'
        );
        form.setValue(
          'requireLowercase',
          settings.PASSWORD_REQUIRE_LOWERCASE === 'true'
        );
        form.setValue(
          'requireNumbers',
          settings.PASSWORD_REQUIRE_NUMBERS === 'true'
        );
        form.setValue(
          'requireSymbols',
          settings.PASSWORD_REQUIRE_SYMBOLS === 'true'
        );
        form.setValue('checkLeaked', settings.PASSWORD_CHECK_LEAKED === 'true');
      } catch (error) {
        console.error('加载密码策略失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载密码策略设置',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPasswordPolicy();
  }, [form, toast]);

  const onSubmit = async (data: PasswordPolicyFormData) => {
    try {
      setIsSaving(true);

      // 准备要更新的设置
      const settingsToUpdate = [
        { key: 'PASSWORD_MIN_LENGTH', value: data.minLength.toString() },
        {
          key: 'PASSWORD_REQUIRE_UPPERCASE',
          value: data.requireUppercase.toString(),
        },
        {
          key: 'PASSWORD_REQUIRE_LOWERCASE',
          value: data.requireLowercase.toString(),
        },
        {
          key: 'PASSWORD_REQUIRE_NUMBERS',
          value: data.requireNumbers.toString(),
        },
        {
          key: 'PASSWORD_REQUIRE_SYMBOLS',
          value: data.requireSymbols.toString(),
        },
        { key: 'PASSWORD_CHECK_LEAKED', value: data.checkLeaked.toString() },
      ];

      // 批量更新设置
      for (const setting of settingsToUpdate) {
        const { error } = await supabase.from(TABLES.systemSettings).upsert({
          key: setting.key,
          value: setting.value,
          description: getSettingDescription(setting.key),
        });

        if (error) throw error;
      }

      toast({
        title: '保存成功',
        description: '密码策略设置已更新',
        variant: 'success',
      });
    } catch (error) {
      console.error('保存密码策略失败:', error);
      toast({
        title: '保存失败',
        description:
          error instanceof Error ? error.message : '保存密码策略设置失败',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            密码安全策略
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
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
          密码安全策略
        </CardTitle>
        <CardDescription>配置系统密码安全要求，提高账户安全性</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='minLength'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最小密码长度</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={8}
                      max={128}
                      {...field}
                      onChange={e =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    密码最少需要包含的字符数（建议至少12位）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>字符要求</h4>

              <FormField
                control={form.control}
                name='requireUppercase'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>大写字母</FormLabel>
                      <FormDescription>
                        要求密码包含至少一个大写字母 (A-Z)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requireLowercase'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>小写字母</FormLabel>
                      <FormDescription>
                        要求密码包含至少一个小写字母 (a-z)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requireNumbers'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>数字</FormLabel>
                      <FormDescription>
                        要求密码包含至少一个数字 (0-9)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requireSymbols'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>特殊字符</FormLabel>
                      <FormDescription>
                        要求密码包含至少一个特殊字符 (!@#$%^&*等)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='checkLeaked'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>泄露密码检查</FormLabel>
                      <FormDescription>
                        检查密码是否在已知数据泄露中出现过 (HaveIBeenPwned)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end'>
              <Button type='submit' disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600' />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function getSettingDescription(key: string): string {
  switch (key) {
    case 'PASSWORD_MIN_LENGTH':
      return '密码最小长度要求';
    case 'PASSWORD_REQUIRE_UPPERCASE':
      return '是否要求包含大写字母';
    case 'PASSWORD_REQUIRE_LOWERCASE':
      return '是否要求包含小写字母';
    case 'PASSWORD_REQUIRE_NUMBERS':
      return '是否要求包含数字';
    case 'PASSWORD_REQUIRE_SYMBOLS':
      return '是否要求包含特殊字符';
    case 'PASSWORD_CHECK_LEAKED':
      return '是否检查密码泄露';
    default:
      return '';
  }
}
