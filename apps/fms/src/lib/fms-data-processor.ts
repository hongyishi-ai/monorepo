import type { 
  FMSAssessmentData, 
  BilateralScore, 
  ClearanceTestResult
} from '@/types/fms-data';
import { CLEARANCE_TEST_MAPPINGS } from '@/data/fms-tests';

/**
 * FMS数据处理工具类
 * 统一处理评估数据的转换、验证和标准化
 */
export class FMSDataProcessor {
  
  /**
   * 将旧格式的路由状态转换为标准化的FMSAssessmentData
   * 解决数据格式不一致的问题
   */
  static normalizeRouteState(routeState: any): FMSAssessmentData {
    const {
      scores = {},
      bilateralScores = {},
      asymmetryIssues = {},
      painfulTests = [],
      basicTests = [],
      clearanceTests = []
    } = routeState;

    // 生成会话ID和时间戳
    const sessionId = `fms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // 处理排除测试结果
    const clearanceResults: ClearanceTestResult[] = clearanceTests.map((testId: string) => ({
      testId,
      isPositive: scores[testId] === 0,
      affectedBaseTest: CLEARANCE_TEST_MAPPINGS[testId as keyof typeof CLEARANCE_TEST_MAPPINGS]
    }));

    // 计算总分
    const basicScoreValues = Object.entries(scores)
      .filter(([testId]) => basicTests.includes(testId))
      .map(([, score]) => score as number);
    const totalScore = basicScoreValues.reduce((sum, score) => sum + score, 0);

    // 标准化双侧分数数据
    const normalizedBilateralScores: Record<string, BilateralScore> = {};
    Object.entries(bilateralScores).forEach(([testId, data]: [string, any]) => {
      if (data && typeof data === 'object') {
        normalizedBilateralScores[testId] = {
          left: data.left,
          right: data.right,
          final: data.final,
          asymmetryData: data.asymmetryData || {
            hasAsymmetry: false,
            asymmetryLevel: 'none' as const,
            riskLevel: 'low' as const,
            scoreDifference: 0
          }
        };
      }
    });

    return {
      sessionId,
      timestamp,
      basicScores: this.extractBasicScores(scores, basicTests),
      bilateralScores: normalizedBilateralScores,
      clearanceResults,
      totalScore,
      asymmetryIssues,
      painfulTests,
      riskFlags: this.generateRiskFlags(scores, painfulTests),
      completedTests: Object.keys(scores),
      incompleteTests: [],
      testSequence: [...basicTests, ...clearanceTests]
    };
  }

  /**
   * 将标准化数据转换为训练页面所需格式
   * 确保训练算法能正确处理数据
   */
  static prepareForTraining(assessmentData: FMSAssessmentData): Record<string, number> {
    const mergedScores: Record<string, number> = { ...assessmentData.basicScores };

    // 添加排除测试分数
    assessmentData.clearanceResults.forEach(result => {
      mergedScores[result.testId] = result.isPositive ? 0 : 1;
    });

    // 添加双侧测试的左右分数
    Object.entries(assessmentData.bilateralScores).forEach(([testId, bilateralData]) => {
      mergedScores[`${testId}-left`] = bilateralData.left;
      mergedScores[`${testId}-right`] = bilateralData.right;
      // 保持原有的基础分数
      if (mergedScores[testId] === undefined) {
        mergedScores[testId] = bilateralData.final;
      }
    });

    console.log('📊 FMSDataProcessor准备训练数据:', mergedScores);
    return mergedScores;
  }

  /**
   * 验证数据完整性
   */
  static validateAssessmentData(data: FMSAssessmentData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必要字段
    if (!data.sessionId) errors.push('缺少会话ID');
    if (!data.timestamp) errors.push('缺少时间戳');

    // 检查分数合理性
    Object.entries(data.basicScores).forEach(([testId, score]) => {
      if (score < 0 || score > 3) {
        errors.push(`${testId}分数超出范围: ${score}`);
      }
    });

    // 检查双侧数据一致性
    Object.entries(data.bilateralScores).forEach(([testId, bilateralData]) => {
      const expectedFinal = Math.min(bilateralData.left, bilateralData.right);
      if (bilateralData.final !== expectedFinal) {
        warnings.push(`${testId}最终分数可能不正确: 期望${expectedFinal}, 实际${bilateralData.final}`);
      }
    });

    // 检查疼痛一致性
    const painTestsFromScores = Object.entries(data.basicScores)
      .filter(([, score]) => score === 0)
      .map(([testId]) => testId);
    
    const missingPainTests = painTestsFromScores.filter(testId => !data.painfulTests.includes(testId));
    if (missingPainTests.length > 0) {
      warnings.push(`发现未记录的疼痛测试: ${missingPainTests.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 生成风险标记
   */
  private static generateRiskFlags(scores: Record<string, number>, painfulTests: string[]): string[] {
    const flags: string[] = [];

    if (painfulTests.length > 0) {
      flags.push('PAIN_PRESENT');
    }

    const lowScores = Object.values(scores).filter(score => score === 1);
    if (lowScores.length >= 3) {
      flags.push('MULTIPLE_DYSFUNCTION');
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (totalScore <= 14) {
      flags.push('LOW_TOTAL_SCORE');
    }

    return flags;
  }

  /**
   * 提取基础测试分数
   */
  private static extractBasicScores(scores: Record<string, number>, basicTests: string[]): Record<string, number> {
    const basicScores: Record<string, number> = {};
    basicTests.forEach(testId => {
      if (scores[testId] !== undefined) {
        basicScores[testId] = scores[testId];
      }
    });
    return basicScores;
  }

  // 排除测试映射关系已从 @/data/fms-tests 统一导入

  /**
   * 数据完整性检查
   */
  static checkDataIntegrity(routeState: any): {
    hasRequiredData: boolean;
    missingFields: string[];
    dataQuality: 'excellent' | 'good' | 'poor';
  } {
    const missingFields: string[] = [];
    
    if (!routeState?.scores || Object.keys(routeState.scores).length === 0) {
      missingFields.push('scores');
    }
    
    if (!routeState?.bilateralScores) {
      missingFields.push('bilateralScores');
    }

    const hasRequiredData = missingFields.length === 0;
    
    let dataQuality: 'excellent' | 'good' | 'poor' = 'excellent';
    if (missingFields.length > 0) {
      dataQuality = 'poor';
    } else if (!routeState.asymmetryIssues || !routeState.painfulTests) {
      dataQuality = 'good';
    }

    return {
      hasRequiredData,
      missingFields,
      dataQuality
    };
  }

  /**
   * 创建数据快照
   */
  static createSnapshot(assessmentData: FMSAssessmentData): string {
    return JSON.stringify({
      version: '1.0',
      timestamp: assessmentData.timestamp,
      sessionId: assessmentData.sessionId,
      dataHash: this.generateDataHash(assessmentData)
    });
  }

  /**
   * 生成数据哈希（用于完整性校验）
   */
  private static generateDataHash(data: FMSAssessmentData): string {
    const hashString = JSON.stringify({
      basicScores: data.basicScores,
      bilateralScores: data.bilateralScores,
      clearanceResults: data.clearanceResults
    });
    
    // 简单哈希算法
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }
} 