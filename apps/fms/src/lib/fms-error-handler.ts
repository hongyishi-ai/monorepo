import type { FMSAssessmentData } from '@/types/fms-data';
import { FMSDataProcessor } from './fms-data-processor';

/**
 * FMS错误处理和数据恢复工具
 */
export class FMSErrorHandler {
  
  /**
   * 数据传递错误类型
   */
  static readonly ErrorTypes = {
    MISSING_SCORES: 'MISSING_SCORES',
    INVALID_BILATERAL_DATA: 'INVALID_BILATERAL_DATA',
    CORRUPT_STATE: 'CORRUPT_STATE',
    NAVIGATION_ERROR: 'NAVIGATION_ERROR',
    ALGORITHM_ERROR: 'ALGORITHM_ERROR'
  } as const;

  /**
   * 处理页面间数据传递错误
   */
  static handleNavigationError(error: any, context: string): {
    canRecover: boolean;
    fallbackData?: any;
    errorMessage: string;
    recoveryOptions: string[];
  } {
    console.error(`🚨 FMS导航错误 [${context}]:`, error);

    const recoveryOptions: string[] = [];
    let canRecover = false;
    let fallbackData: any = undefined;
    let errorMessage = '数据传递出现问题';

    // 尝试从localStorage恢复数据
    try {
      const savedData = localStorage.getItem('fms_last_assessment');
      if (savedData) {
        fallbackData = JSON.parse(savedData);
        canRecover = true;
        recoveryOptions.push('从本地存储恢复数据');
      }
    } catch (e) {
      console.warn('无法从localStorage恢复数据');
    }

    // 根据错误类型提供不同的恢复方案
    if (error?.message?.includes('scores')) {
      errorMessage = '评估分数数据丢失';
      recoveryOptions.push('重新进行评估');
    } else if (error?.message?.includes('bilateral')) {
      errorMessage = '双侧测试数据异常';
      recoveryOptions.push('重新进行双侧测试');
    }

    recoveryOptions.push('返回首页重新开始');

    return {
      canRecover,
      fallbackData,
      errorMessage,
      recoveryOptions
    };
  }

  /**
   * 验证路由状态数据
   */
  static validateRouteState(routeState: any): {
    isValid: boolean;
    errors: string[];
    canProceed: boolean;
    sanitizedData?: any;
  } {
    const errors: string[] = [];

    if (!routeState) {
      errors.push('路由状态为空');
      return { isValid: false, errors, canProceed: false };
    }

    // 检查必要数据
    if (!routeState.scores || Object.keys(routeState.scores).length === 0) {
      errors.push('缺少评估分数数据');
    }

    if (typeof routeState.bilateralScores !== 'object') {
      errors.push('双侧测试数据格式错误');
    }

    // 数据修复尝试
    const sanitizedData = this.sanitizeRouteState(routeState);
    const canProceed = errors.length === 0 || sanitizedData !== null;

    return {
      isValid: errors.length === 0,
      errors,
      canProceed,
      sanitizedData: sanitizedData || routeState
    };
  }

  /**
   * 数据清理和修复
   */
  private static sanitizeRouteState(routeState: any): any | null {
    try {
      const sanitized = { ...routeState };

      // 修复缺失的scores
      if (!sanitized.scores) {
        sanitized.scores = {};
      }

      // 修复缺失的bilateralScores
      if (!sanitized.bilateralScores) {
        sanitized.bilateralScores = {};
      }

      // 修复缺失的数组
      if (!Array.isArray(sanitized.painfulTests)) {
        sanitized.painfulTests = [];
      }

      if (!Array.isArray(sanitized.basicTests)) {
        sanitized.basicTests = ['deep-squat', 'hurdle-step', 'inline-lunge', 'shoulder-mobility', 'active-straight-leg-raise', 'trunk-stability-push-up', 'rotary-stability'];
      }

      if (!Array.isArray(sanitized.clearanceTests)) {
        sanitized.clearanceTests = ['shoulder-impingement-clearance', 'spinal-flexion-clearance', 'spinal-extension-clearance'];
      }

      // 修复缺失的asymmetryIssues
      if (!sanitized.asymmetryIssues) {
        sanitized.asymmetryIssues = {};
      }

      return sanitized;
    } catch (error) {
      console.error('数据清理失败:', error);
      return null;
    }
  }

  /**
   * 自动保存评估数据
   */
  static saveAssessmentData(data: any, source: string): void {
    try {
      const saveData = {
        timestamp: new Date().toISOString(),
        source,
        data: FMSDataProcessor.normalizeRouteState(data)
      };
      
      localStorage.setItem('fms_last_assessment', JSON.stringify(saveData));
      console.log(`💾 自动保存FMS数据 [${source}]`);
    } catch (error) {
      console.warn('保存FMS数据失败:', error);
    }
  }

  /**
   * 获取保存的数据
   */
  static getSavedAssessmentData(): FMSAssessmentData | null {
    try {
      const savedData = localStorage.getItem('fms_last_assessment');
      if (!savedData) return null;

      const parsed = JSON.parse(savedData);
      return parsed.data;
    } catch (error) {
      console.warn('读取保存的数据失败:', error);
      return null;
    }
  }

  /**
   * 创建错误报告
   */
  static createErrorReport(error: any, context: string, userData?: any): string {
    const report = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userData: userData ? {
        hasScores: !!userData.scores,
        scoresCount: userData.scores ? Object.keys(userData.scores).length : 0,
        hasBilateralData: !!userData.bilateralScores,
        bilateralCount: userData.bilateralScores ? Object.keys(userData.bilateralScores).length : 0
      } : null
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 网络错误重试机制
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`操作失败，${delay}ms后重试 (${attempt}/${maxRetries}):`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 数据完整性自检
   */
  static performIntegrityCheck(data: any): {
    passed: boolean;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      fix?: string;
    }>;
  } {
    const issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      fix?: string;
    }> = [];

    // 检查分数范围
    if (data.scores) {
      Object.entries(data.scores).forEach(([testId, score]: [string, any]) => {
        if (typeof score !== 'number' || score < 0 || score > 3) {
          issues.push({
            severity: 'error',
            message: `${testId}分数无效: ${score}`,
            fix: '重新评估该项目'
          });
        }
      });
    }

    // 检查双侧数据一致性
    if (data.bilateralScores) {
      Object.entries(data.bilateralScores).forEach(([testId, bilateralData]: [string, any]) => {
        if (bilateralData && typeof bilateralData === 'object') {
          const { left, right, final } = bilateralData;
          const expectedFinal = Math.min(left, right);
          
          if (final !== expectedFinal) {
            issues.push({
              severity: 'warning',
              message: `${testId}最终分数不一致: 左${left}, 右${right}, 最终${final}`,
              fix: `应为${expectedFinal}`
            });
          }
        }
      });
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
} 