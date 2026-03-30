/**
 * 密码强度验证工具
 * 提供密码复杂度检查和泄露检查功能
 */

import { TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 分数
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  checkLeaked: boolean;
}

// 默认密码要求
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  checkLeaked: true,
};

/**
 * 检查密码复杂度
 */
export function validatePasswordComplexity(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;

  // 检查长度
  if (password.length < requirements.minLength) {
    feedback.push(`密码长度至少需要 ${requirements.minLength} 个字符`);
  } else {
    score += 1;
  }

  // 检查大写字母
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('密码需要包含至少一个大写字母');
  } else if (requirements.requireUppercase) {
    score += 1;
  }

  // 检查小写字母
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('密码需要包含至少一个小写字母');
  } else if (requirements.requireLowercase) {
    score += 1;
  }

  // 检查数字
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    feedback.push('密码需要包含至少一个数字');
  } else if (requirements.requireNumbers) {
    score += 1;
  }

  // 检查特殊字符
  if (
    requirements.requireSymbols &&
    !/[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|]/.test(password)
  ) {
    feedback.push('密码需要包含至少一个特殊字符');
  } else if (requirements.requireSymbols) {
    score += 1;
  }

  // 额外的复杂度检查
  if (password.length >= 16) {
    score += 0.5;
  }

  // 检查重复字符
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('避免使用连续重复的字符');
    score -= 0.5;
  }

  // 检查常见模式
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push('避免使用常见的密码模式');
      score -= 1;
      break;
    }
  }

  // 确保分数在合理范围内
  score = Math.max(0, Math.min(4, score));

  // 确定强度等级
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 2) {
    strength = 'weak';
  } else if (score < 3) {
    strength = 'fair';
  } else if (score < 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    isValid: feedback.length === 0,
    score,
    feedback,
    strength,
  };
}

/**
 * 检查密码是否在已知泄露列表中
 * 使用 HaveIBeenPwned API 的 k-anonymity 模型
 */
export async function checkPasswordLeak(password: string): Promise<boolean> {
  try {
    // 计算密码的 SHA-1 哈希
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', passwordData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // 使用 k-anonymity 模型，只发送哈希的前5位
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    if (!response.ok) {
      console.warn('无法检查密码泄露状态，跳过检查');
      return false;
    }

    const data = await response.text();
    const leakedHashes = data.split('\n');

    // 检查我们的密码哈希是否在泄露列表中
    return leakedHashes.some(line => {
      const [hash] = line.split(':');
      return hash === suffix;
    });
  } catch (error) {
    console.warn('密码泄露检查失败:', error);
    return false; // 如果检查失败，不阻止用户使用密码
  }
}

/**
 * 完整的密码验证（包括泄露检查）
 */
export async function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): Promise<PasswordValidationResult> {
  // 首先检查复杂度
  const complexityResult = validatePasswordComplexity(password, requirements);

  // 如果复杂度检查失败，直接返回
  if (!complexityResult.isValid) {
    return complexityResult;
  }

  // 如果需要检查泄露
  if (requirements.checkLeaked) {
    const isLeaked = await checkPasswordLeak(password);
    if (isLeaked) {
      return {
        ...complexityResult,
        isValid: false,
        feedback: [
          ...complexityResult.feedback,
          '此密码已在数据泄露中被发现，请选择其他密码',
        ],
      };
    }
  }

  return complexityResult;
}

/**
 * 生成密码强度颜色
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'fair':
      return 'text-orange-600';
    case 'good':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * 生成密码强度文本
 */
export function getPasswordStrengthText(strength: string): string {
  switch (strength) {
    case 'weak':
      return '弱';
    case 'fair':
      return '一般';
    case 'good':
      return '良好';
    case 'strong':
      return '强';
    default:
      return '未知';
  }
}

/**
 * 从系统设置中获取密码要求
 */
export async function getPasswordRequirementsFromSettings(): Promise<PasswordRequirements> {
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

    if (error) {
      console.warn('获取密码设置失败，使用默认设置:', error);
      return DEFAULT_PASSWORD_REQUIREMENTS;
    }

    // 将设置转换为密码要求对象
    const settings =
      data?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, string>
      ) || {};

    return {
      minLength: parseInt(settings.PASSWORD_MIN_LENGTH || '12', 10),
      requireUppercase: settings.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: settings.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: settings.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSymbols: settings.PASSWORD_REQUIRE_SYMBOLS !== 'false',
      checkLeaked: settings.PASSWORD_CHECK_LEAKED !== 'false',
    };
  } catch (error) {
    console.warn('获取密码设置失败，使用默认设置:', error);
    return DEFAULT_PASSWORD_REQUIREMENTS;
  }
}
