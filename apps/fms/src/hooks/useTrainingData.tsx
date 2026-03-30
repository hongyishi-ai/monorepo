import { useMemo } from 'react';
import type { FMSAssessmentData } from '@/types/fms-data';

interface UseTrainingDataProps {
  assessmentData: FMSAssessmentData | null;
}

/**
 * 自定义Hook：训练数据处理 (简化版本)
 * 遵循React哲学：
 * - 单一职责：专门处理训练相关的数据逻辑
 * - 状态与UI分离：业务逻辑与渲染分离
 * - 纯函数思维：基于评估数据分析训练需求
 */
export const useTrainingData = ({ assessmentData }: UseTrainingDataProps) => {
  
  // 训练需求分析 - 遵循"不可变性原则"
  const trainingAnalysis = useMemo(() => {
    if (!assessmentData) {
      return null;
    }

    return {
      hasPainIssues: assessmentData.painfulTests.length > 0,
      hasAsymmetryIssues: Object.keys(assessmentData.asymmetryIssues).length > 0,
      totalScore: assessmentData.totalScore,
      needsBasicTraining: assessmentData.totalScore < 14,
      needsAdvancedTraining: assessmentData.totalScore >= 17
    };
  }, [assessmentData]);

  // 训练优先级 - 遵循"状态即真理"原则
  const trainingPriority = useMemo(() => {
    if (!trainingAnalysis) {
      return {
        primary: '暂无数据',
        secondary: [],
        urgency: 'low'
      };
    }

    const priorities = [];
    let urgency = 'low';

    if (trainingAnalysis.hasPainIssues) {
      priorities.push('疼痛管理');
      urgency = 'high';
    }

    if (trainingAnalysis.hasAsymmetryIssues) {
      priorities.push('不对称纠正');
      if (urgency === 'low') urgency = 'medium';
    }

    if (trainingAnalysis.needsBasicTraining) {
      priorities.push('基础功能提升');
    }

    return {
      primary: priorities[0] || '维持功能',
      secondary: priorities.slice(1),
      urgency
    };
  }, [trainingAnalysis]);

  // 训练建议 - 遵循"透明规则"
  const recommendations = useMemo(() => {
    if (!assessmentData) {
      return {
        general: [],
        specific: [],
        precautions: []
      };
    }

    const general = [];
    const specific = [];
    const precautions = [];

    // 一般性建议
    general.push('按照优先级顺序进行训练，确保动作质量');
    general.push('如有疼痛应立即停止并咨询专业人员');
    
    // 特定建议
    if (assessmentData.painfulTests.length > 0) {
      specific.push('优先处理疼痛问题，疼痛缓解后再进行功能训练');
      precautions.push('训练过程中避免诱发疼痛的动作');
    }

    if (Object.keys(assessmentData.asymmetryIssues).length > 0) {
      specific.push('重点关注双侧动作的对称性，必要时可单侧加强');
      precautions.push('避免加重现有的不对称模式');
    }

    if (assessmentData.totalScore < 14) {
      specific.push('从基础动作开始，逐步提高动作复杂度');
      precautions.push('避免过早进行高难度动作');
    }

    return {
      general,
      specific,
      precautions
    };
  }, [assessmentData]);

  return {
    trainingAnalysis,
    trainingPriority,
    recommendations,
    // 便利方法
    hasData: !!trainingAnalysis,
    needsAttention: trainingPriority.urgency === 'high',
    isLoading: false // 可以后续添加加载状态
  };
}; 