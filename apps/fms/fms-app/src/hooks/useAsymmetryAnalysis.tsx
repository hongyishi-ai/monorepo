import { useMemo } from 'react';
import { getAsymmetryRiskAssessment, CLEARANCE_TESTS } from '@/data/fms-tests';

interface AsymmetryData {
  riskLevel: 'low' | 'medium' | 'high';
  leftScore: number;
  rightScore: number;
  scoreDifference: number;
  recommendation: string;
}

interface UseAsymmetryAnalysisProps {
  bilateralScores: Record<string, any>;
  asymmetryIssues: Record<string, AsymmetryData>;
}

/**
 * 自定义Hook：不对称性分析
 * 遵循React哲学：
 * - 单一职责：专门处理不对称相关的分析逻辑
 * - 纯函数思维：基于输入数据进行计算，无副作用
 * - 组合优于继承：可与其他hooks组合使用
 */
export const useAsymmetryAnalysis = ({
  bilateralScores,
  asymmetryIssues
}: UseAsymmetryAnalysisProps) => {

  // 过滤排除测试的对称1分情况 - 修复核心逻辑错误
  const filteredAsymmetryIssues = useMemo(() => {
    const clearanceTestIds = CLEARANCE_TESTS.map(test => test.id);
    
    return Object.fromEntries(
      Object.entries(asymmetryIssues).filter(([testId, data]) => {
        // 如果是排除测试且双侧都是1分（正常），则不应该被认为是不对称问题
        if (clearanceTestIds.includes(testId)) {
          const { leftScore, rightScore } = data;
          // 排除测试：1分表示正常，对称的1分不是问题
          if (leftScore === 1 && rightScore === 1) {
            return false;
          }
        }
        return true;
      })
    );
  }, [asymmetryIssues]);

  // 不对称性风险评估 - 遵循"不可变性原则"
  const riskAssessment = useMemo(() => {
    const asymmetryEntries = Object.entries(filteredAsymmetryIssues);
    
    if (asymmetryEntries.length === 0) {
      return {
        overallRisk: 'low' as const,
        riskDescription: '未检测到明显的不对称问题',
        riskColor: 'text-green-600',
        riskBg: 'bg-green-50 border-green-200'
      };
    }

    const highRiskCount = asymmetryEntries.filter(([, data]) => data.riskLevel === 'high').length;
    const mediumRiskCount = asymmetryEntries.filter(([, data]) => data.riskLevel === 'medium').length;

    if (highRiskCount > 0) {
      return {
        overallRisk: 'high' as const,
        riskDescription: `检测到${highRiskCount}项高风险不对称问题`,
        riskColor: 'text-red-600',
        riskBg: 'bg-red-50 border-red-200'
      };
    }

    if (mediumRiskCount > 0) {
      return {
        overallRisk: 'medium' as const,
        riskDescription: `检测到${mediumRiskCount}项中等风险不对称问题`,
        riskColor: 'text-amber-600',
        riskBg: 'bg-amber-50 border-amber-200'
      };
    }

    return {
      overallRisk: 'low' as const,
      riskDescription: '检测到轻微不对称，建议关注',
      riskColor: 'text-blue-600',
      riskBg: 'bg-blue-50 border-blue-200'
    };
  }, [filteredAsymmetryIssues]);

  // 详细不对称分析 - 遵循"声明式"原则
  const detailedAnalysis = useMemo(() => {
    return Object.entries(filteredAsymmetryIssues).map(([testId, data]) => {
      // 将分数差异转换为字符串格式
      const asymmetryLevelStr = data.scoreDifference.toString();
      const riskAssessment = getAsymmetryRiskAssessment(asymmetryLevelStr, testId);
      
      return {
        testId,
        testName: testId, // 可以后续从测试映射中获取真实名称
        leftScore: data.leftScore,
        rightScore: data.rightScore,
        scoreDifference: data.scoreDifference,
        riskLevel: data.riskLevel,
        recommendation: data.recommendation,
        riskDescription: riskAssessment.description,
        correctionPriority: riskAssessment.priority
      };
    }).sort((a, b) => {
      // 按风险级别排序：high > medium > low
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }, [filteredAsymmetryIssues]);

  // 统计信息 - 遵循"状态即真理"原则
  const statistics = useMemo(() => {
    const total = Object.keys(filteredAsymmetryIssues).length;
    const highRisk = detailedAnalysis.filter(item => item.riskLevel === 'high').length;
    const mediumRisk = detailedAnalysis.filter(item => item.riskLevel === 'medium').length;
    const lowRisk = detailedAnalysis.filter(item => item.riskLevel === 'low').length;

    return {
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      hasAnyAsymmetry: total > 0,
      hasHighRisk: highRisk > 0,
      hasMediumRisk: mediumRisk > 0
    };
  }, [filteredAsymmetryIssues, detailedAnalysis]);

  // 训练建议 - 遵循"组合规则"
  const trainingRecommendations = useMemo(() => {
    const highPriorityItems = detailedAnalysis.filter(item => 
      item.riskLevel === 'high' || item.riskLevel === 'medium'
    );

    if (highPriorityItems.length === 0) {
      return {
        hasRecommendations: false,
        primaryFocus: null,
        recommendations: []
      };
    }

    const primaryFocus = highPriorityItems[0]; // 风险最高的项目
    const allRecommendations = highPriorityItems.map(item => ({
      testId: item.testId,
      testName: item.testName,
      recommendation: item.recommendation,
      priority: item.riskLevel
    }));

    return {
      hasRecommendations: true,
      primaryFocus,
      recommendations: allRecommendations
    };
  }, [detailedAnalysis]);

  // 双侧评分概览 - 遵循"简单规则"
  const bilateralOverview = useMemo(() => {
    return Object.entries(bilateralScores).map(([testId, scoreData]) => ({
      testId,
      leftScore: scoreData.left,
      rightScore: scoreData.right,
      finalScore: scoreData.final,
      hasAsymmetry: Math.abs(scoreData.left - scoreData.right) > 0,
      asymmetryLevel: Math.abs(scoreData.left - scoreData.right)
    }));
  }, [bilateralScores]);

  return {
    riskAssessment,
    detailedAnalysis,
    statistics,
    trainingRecommendations,
    bilateralOverview,
    // 便利方法
    hasAsymmetry: statistics.hasAnyAsymmetry,
    hasHighRisk: statistics.hasHighRisk,
    needsAttention: statistics.hasHighRisk || statistics.hasMediumRisk
  };
}; 