import { useMemo } from 'react';
import { FMS_TESTS, CLEARANCE_TEST_MAPPINGS } from '@/data/fms-tests';
import type { FmsTest } from '@/data/fms-tests';

// 创建测试映射，遵循"优化规则" - 避免重复计算
const testMap = FMS_TESTS.reduce((acc, test) => {
  acc[test.id] = test;
  return acc;
}, {} as Record<string, FmsTest>);

const testNameMap = FMS_TESTS.reduce((acc, test) => {
  acc[test.id] = test.name;
  return acc;
}, {} as Record<string, string>);

interface UseReportDataProps {
  scores: Record<string, number>;
  bilateralScores: Record<string, any>;
  asymmetryIssues: Record<string, any>;
  painfulTests: string[];
  basicTestIds: string[];
  clearanceTestIds: string[];
}

/**
 * 自定义Hook：报告数据计算与分析
 * 遵循React哲学：
 * - 单一职责：专门处理报告数据的计算逻辑
 * - 状态与UI分离：将计算逻辑从组件中抽离
 * - 纯函数思维：输入相同则输出相同
 */
export const useReportData = ({
  scores,
  asymmetryIssues,
  painfulTests,
  basicTestIds,
  clearanceTestIds
}: Omit<UseReportDataProps, 'bilateralScores'>) => {
  
  // 基础分数计算 - 遵循"不可变性原则"
  const basicScoreData = useMemo(() => {
    const basicTestsScores = Object.entries(scores).filter(([testId]) => 
      basicTestIds.includes(testId)
    );
    const totalScore = basicTestsScores.reduce((sum, [, score]) => sum + score, 0);
    const maxScore = basicTestIds.length * 3;
    
    return {
      basicTestsScores,
      totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100)
    };
  }, [scores, basicTestIds]);

  // 排除测试分析 - 遵循"纯函数"原则
  const clearanceAnalysis = useMemo(() => {
    const clearanceTestsScores = Object.entries(scores).filter(([testId]) => 
      clearanceTestIds.includes(testId)
    );
    const failedTests = clearanceTestsScores.filter(([, score]) => score === 0);
    
    const affectedBasicTests = failedTests
      .map(([clearanceTestId]) => 
        CLEARANCE_TEST_MAPPINGS[clearanceTestId as keyof typeof CLEARANCE_TEST_MAPPINGS]
      )
      .filter(Boolean)
      .map(testId => testMap[testId])
      .filter(Boolean);

    return {
      clearanceTestsScores,
      failedTests,
      affectedBasicTests,
      hasFailedClearance: failedTests.length > 0
    };
  }, [scores, clearanceTestIds]);

  // 不对称性统计 - 遵循"单一职责"原则
  const asymmetryAnalysis = useMemo(() => {
    const asymmetryCount = Object.keys(asymmetryIssues).length;
    const highRiskCount = Object.values(asymmetryIssues)
      .filter((issue: any) => issue.riskLevel === 'high').length;
    const mediumRiskCount = Object.values(asymmetryIssues)
      .filter((issue: any) => issue.riskLevel === 'medium').length;

    return {
      asymmetryCount,
      highRiskCount,
      mediumRiskCount,
      hasAsymmetry: asymmetryCount > 0,
      hasHighRisk: highRiskCount > 0
    };
  }, [asymmetryIssues]);

  // 雷达图数据 - 遵循"声明式"原则
  const chartData = useMemo(() => {
    return basicScoreData.basicTestsScores.map(([testId, score]) => ({
      subject: testNameMap[testId]?.split(' (')[0] || testId,
      score: score,
      fullMark: 3,
    }));
  }, [basicScoreData.basicTestsScores]);

  // 低分测试识别 - 遵循"可预测性"原则
  const lowScoringTests = useMemo(() => {
    return basicScoreData.basicTestsScores
      .filter(([, score]) => score < 2)
      .map(([testId]) => testMap[testId])
      .filter(Boolean);
  }, [basicScoreData.basicTestsScores]);

  // 评估状态计算 - 遵循"状态即真理"原则
  const assessmentStatus = useMemo(() => {
    const hasPain = painfulTests.length > 0;
    
    if (hasPain || clearanceAnalysis.hasFailedClearance) {
      return {
        status: '需要关注',
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-200',
        description: '检测到疼痛或功能异常'
      };
    }
    
    if (asymmetryAnalysis.hasHighRisk) {
      return {
        status: '需要关注',
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-200',
        description: '存在高风险不对称'
      };
    }
    
    if (asymmetryAnalysis.mediumRiskCount > 0 || basicScoreData.totalScore < 14) {
      return {
        status: '建议改善',
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-200',
        description: '存在功能受限或不对称风险'
      };
    }
    
    if (basicScoreData.totalScore >= 17) {
      return {
        status: '功能良好',
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        description: '功能性动作表现优秀'
      };
    }
    
    if (basicScoreData.totalScore >= 14) {
      return {
        status: '功能良好',
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        description: '功能性动作表现良好'
      };
    }
    
    return {
      status: '建议改善',
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      description: '功能性动作需要提升'
    };
  }, [
    painfulTests.length,
    clearanceAnalysis.hasFailedClearance,
    asymmetryAnalysis.hasHighRisk,
    asymmetryAnalysis.mediumRiskCount,
    basicScoreData.totalScore
  ]);

  // 返回所有计算结果 - 遵循"透明规则"
  return {
    basicScoreData,
    clearanceAnalysis,
    asymmetryAnalysis,
    chartData,
    lowScoringTests,
    assessmentStatus,
    // 便利方法
    hasPain: painfulTests.length > 0,
    hasAsymmetry: asymmetryAnalysis.hasAsymmetry,
    // 测试映射（供组件使用）
    testMap,
    testNameMap
  };
}; 