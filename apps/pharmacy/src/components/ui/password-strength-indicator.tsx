/**
 * 密码强度指示器组件
 * 显示密码强度和验证反馈
 */

import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PASSWORD_REQUIREMENTS,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  validatePassword,
  type PasswordRequirements,
  type PasswordValidationResult,
} from '@/utils/password-validator';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (result: PasswordValidationResult) => void;
  requirements?: PasswordRequirements;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  onValidationChange,
  requirements = DEFAULT_PASSWORD_REQUIREMENTS,
  showRequirements = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const [validationResult, setValidationResult] =
    useState<PasswordValidationResult>({
      isValid: false,
      score: 0,
      feedback: [],
      strength: 'weak',
    });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkPassword = async () => {
      if (!password) {
        const emptyResult: PasswordValidationResult = {
          isValid: false,
          score: 0,
          feedback: [],
          strength: 'weak',
        };
        setValidationResult(emptyResult);
        onValidationChange?.(emptyResult);
        return;
      }

      setIsChecking(true);
      try {
        const result = await validatePassword(password, requirements);
        setValidationResult(result);
        onValidationChange?.(result);
      } catch (error) {
        console.error('密码验证失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // 防抖处理，避免频繁调用API
    const timeoutId = setTimeout(checkPassword, 500);
    return () => clearTimeout(timeoutId);
  }, [password, requirements, onValidationChange]);

  if (!password) {
    return null;
  }

  const progressValue = (validationResult.score / 4) * 100;
  const strengthColor = getPasswordStrengthColor(validationResult.strength);
  const strengthText = getPasswordStrengthText(validationResult.strength);

  return (
    <div className={cn('space-y-3', className)}>
      {/* 密码强度进度条 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>密码强度</span>
          <span className={cn('font-medium', strengthColor)}>
            {isChecking ? '检查中...' : strengthText}
          </span>
        </div>
        <Progress
          value={progressValue}
          className='h-2'
          indicatorClassName={cn(
            'transition-all duration-300',
            validationResult.strength === 'weak' && 'bg-red-500',
            validationResult.strength === 'fair' && 'bg-orange-500',
            validationResult.strength === 'good' && 'bg-yellow-500',
            validationResult.strength === 'strong' && 'bg-green-500'
          )}
        />
      </div>

      {/* 验证反馈 */}
      {validationResult.feedback.length > 0 && (
        <div className='space-y-2'>
          {validationResult.feedback.map((feedback, index) => (
            <div key={index} className='flex items-start gap-2 text-sm'>
              <AlertCircle className='h-4 w-4 text-red-500 mt-0.5 flex-shrink-0' />
              <span className='text-red-600'>{feedback}</span>
            </div>
          ))}
        </div>
      )}

      {/* 密码要求列表 */}
      {showRequirements && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-muted-foreground'>
            密码要求：
          </h4>
          <div className='space-y-1'>
            <RequirementItem
              met={password.length >= requirements.minLength}
              text={`至少 ${requirements.minLength} 个字符`}
            />
            {requirements.requireUppercase && (
              <RequirementItem
                met={/[A-Z]/.test(password)}
                text='包含大写字母'
              />
            )}
            {requirements.requireLowercase && (
              <RequirementItem
                met={/[a-z]/.test(password)}
                text='包含小写字母'
              />
            )}
            {requirements.requireNumbers && (
              <RequirementItem met={/[0-9]/.test(password)} text='包含数字' />
            )}
            {requirements.requireSymbols && (
              <RequirementItem
                met={/[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|]/.test(password)}
                text='包含特殊字符'
              />
            )}
            {requirements.checkLeaked && (
              <RequirementItem
                met={validationResult.isValid && !isChecking}
                text='未在数据泄露中发现'
                loading={isChecking}
              />
            )}
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {validationResult.isValid && !isChecking && (
        <div className='flex items-center gap-2 text-sm text-green-600'>
          <CheckCircle className='h-4 w-4' />
          <span>密码符合所有安全要求</span>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
  loading?: boolean;
}

function RequirementItem({ met, text, loading }: RequirementItemProps) {
  return (
    <div className='flex items-center gap-2 text-sm'>
      {loading ? (
        <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600' />
      ) : met ? (
        <CheckCircle className='h-4 w-4 text-green-500' />
      ) : (
        <AlertCircle className='h-4 w-4 text-gray-400' />
      )}
      <span
        className={cn(
          met ? 'text-green-600' : 'text-gray-600',
          loading && 'text-blue-600'
        )}
      >
        {text}
      </span>
    </div>
  );
}

interface PasswordInputWithStrengthProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: PasswordValidationResult) => void;
  requirements?: PasswordRequirements;
  showRequirements?: boolean;
  error?: string;
  className?: string;
}

export function PasswordInputWithStrength({
  label = '密码',
  placeholder = '请输入密码',
  value,
  onChange,
  onValidationChange,
  requirements = DEFAULT_PASSWORD_REQUIREMENTS,
  showRequirements = true,
  error,
  className,
}: PasswordInputWithStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div className='space-y-2'>
        <Label htmlFor='password'>{label}</Label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={cn(
              'pr-10',
              error && 'border-red-500 focus:border-red-500'
            )}
          />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className='h-4 w-4 text-gray-400' />
            ) : (
              <Eye className='h-4 w-4 text-gray-400' />
            )}
          </Button>
        </div>
        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>

      <PasswordStrengthIndicator
        password={value}
        onValidationChange={onValidationChange}
        requirements={requirements}
        showRequirements={showRequirements}
      />
    </div>
  );
}
