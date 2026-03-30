// 导入完整的FMS动作数据库
import fmsExercisesDataRaw from '@/data/complete-fms-exercises.json';
// 导入统一的排除测试映射关系
import { CLEARANCE_TEST_MAPPINGS } from '@/data/fms-tests';

// 类型定义
interface Exercise {
  id: string;
  name: string;
  type: string;
  description: string;
  parameters: string;
  instructions: string[];
  precautions: string[];
  progression: string;
  regression: string;
}

interface Contraindication {
  redLight: string[];
  yellowLight: string[];
  greenLight: string[];
}

interface FMSExercisesData {
  fmsCorrectiveExercises: Record<string, Exercise[]>;
  trainingContraindications: Record<string, Contraindication>;
  correctionPriority: Record<string, number>;
}

// 训练阶段和综合训练计划类型
interface TrainingPhase {
  phase: number;
  title: string;
  description: string;
  prerequisite?: string;
  correctionPlans: CorrectionPlan[];
  estimatedWeeks: number;
}

interface ComprehensiveTrainingPlan {
  phases: TrainingPhase[];
  totalSteps: number;
  estimatedWeeks: number;
  hasPainIssues: boolean;
}

interface CorrectionPlan {
  step: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  testId: string;
  testName: string;
  issue: 'pain' | 'asymmetry_with_dysfunction' | 'dysfunction' | 'asymmetry_performance' | 'improvement';
  side?: 'left' | 'right' | 'bilateral';
  exercises: Exercise[];
  contraindications?: Contraindication;
  strategy: string;
  phase: number;
}

// 类型断言
const fmsExercisesData = fmsExercisesDataRaw as unknown as FMSExercisesData;

// 训练禁忌数据
const TRAINING_CONTRAINDICATIONS = fmsExercisesData.trainingContraindications;

// FMS纠正动作数据库
const FMS_EXERCISES = fmsExercisesData.fmsCorrectiveExercises;

// FMS测试优先级顺序（基于文档第一部分的层级结构）
const FMS_TEST_PRIORITY = {
  // 小四项（更基础、更原始）
  'active-straight-leg-raise': 1,
  'shoulder-mobility': 2,
  'rotary-stability': 3,
  'trunk-stability-push-up': 4,
  // 大三项（综合性测试）
  'hurdle-step': 5,
  'inline-lunge': 6,
  'deep-squat': 7
};

// 生成简洁的纠正策略
const generateStrategy = (issue: string, _testName: string, side?: string): string => {
  switch (issue) {
    case 'pain':
      return '立即停止训练，寻求专业医学评估';
    
    case 'asymmetry_with_dysfunction':
      const dysfunctionSide = side === 'left' ? '左侧' : '右侧';
      return `针对${dysfunctionSide}进行单侧纠正训练，目标是消除功能障碍`;
    
    case 'dysfunction':
      return '双侧同步纠正训练，重点解决动作模式的根本缺陷';
    
    case 'asymmetry_performance':
      const performanceSide = side === 'left' ? '左侧' : '右侧';
      return `提升${performanceSide}的动作质量，属于低优先级的可选纠正项目`;
    
    case 'improvement':
      return '在保持功能性动作质量的基础上，追求动作的完美表现';
    
    default:
      return '根据具体情况制定针对性纠正方案';
  }
};

// 获取测试名称的辅助函数
const getTestName = (testId: string): string => {
  const nameMap: Record<string, string> = {
    // 7项基础测试
    'active-straight-leg-raise': '主动直腿上抬',
    'shoulder-mobility': '肩关节活动度',
    'rotary-stability': '旋转稳定性',
    'trunk-stability-push-up': '躯干稳定俯卧撑',
    'hurdle-step': '跨栏步',
    'inline-lunge': '直线箭步蹲',
    'deep-squat': '过顶深蹲',
    // 3项排除测试
    'shoulder-impingement-clearance': '肩部撞击排除测试',
    'spinal-flexion-clearance': '脊柱屈曲排除测试',
    'spinal-extension-clearance': '脊柱伸展排除测试'
  };
  
  // 处理带侧别标识的testId（如"hurdle-step-left", "hurdle-step-right"）
  if (testId.includes('-left') || testId.includes('-right')) {
    const side = testId.includes('-left') ? '左侧' : '右侧';
    const baseTestId = testId.replace('-left', '').replace('-right', '');
    const baseName = nameMap[baseTestId];
    if (baseName) {
      return `${baseName} (${side})`;
    }
  }
  
  return nameMap[testId] || testId;
};

// 按优先级排序测试项目
const sortTestsByPriority = (testIds: string[]): string[] => {
  return testIds.sort((a, b) => {
    const priorityA = FMS_TEST_PRIORITY[a as keyof typeof FMS_TEST_PRIORITY] || 999;
    const priorityB = FMS_TEST_PRIORITY[b as keyof typeof FMS_TEST_PRIORITY] || 999;
    return priorityA - priorityB;
  });
};

// 主要算法：实现分阶段FMS纠正算法 - 符合权威处理协议
export const generateComprehensiveTrainingPlan = (scores: Record<string, number>): ComprehensiveTrainingPlan => {
  console.log('🔍 算法输入scores:', scores);
  
  const phases: TrainingPhase[] = [];
  let stepCounter = 1;
  let currentPhase = 1;

  // 解析分数，区分基础测试分数和排除测试结果
  const parseScores = (scores: Record<string, number>) => {
    const baseScores: Record<string, number> = {};
    const clearancePainTests: string[] = []; // 排除测试阳性
    const basePainTests: string[] = []; // 基础测试本身疼痛
    const pendingDysfunctionAfterPain: string[] = []; // 新增：疼痛解决后需要处理的1分残余
    // 明确定义双侧测试（有左右之分的测试）
    const bilateralTests = ['hurdle-step', 'inline-lunge', 'shoulder-mobility', 'active-straight-leg-raise', 'rotary-stability'];
    

    
    // 使用统一的排除测试映射关系
    
    // 首先识别排除测试的结果
    Object.entries(scores).forEach(([testId, score]) => {
      if (testId.includes('clearance') && score === 0) {
        clearancePainTests.push(testId);
        console.log(`🏥 检测到排除测试阳性: ${testId}`);
        // 标记相关的基础测试受到影响
        const relatedBaseTest = CLEARANCE_TEST_MAPPINGS[testId as keyof typeof CLEARANCE_TEST_MAPPINGS];
        if (relatedBaseTest) {
          // 如果基础测试有实际分数，保存它
          if (scores[relatedBaseTest] !== undefined && scores[relatedBaseTest] > 0) {
            baseScores[relatedBaseTest] = scores[relatedBaseTest];
          }
        }
      } else if (!testId.includes('clearance')) {
        // 处理基础测试
        if (score === 0) {
          // 检查这个0分是否由排除测试导致
          const isClearanceRelated = Object.values(CLEARANCE_TEST_MAPPINGS).includes(testId as any);
          if (!isClearanceRelated || !clearancePainTests.some(ct => CLEARANCE_TEST_MAPPINGS[ct as keyof typeof CLEARANCE_TEST_MAPPINGS] === testId)) {
            basePainTests.push(testId);
            console.log(`🏥 检测到基础测试疼痛: ${testId}`);
          }
        } else {
          baseScores[testId] = score;
        }
      }
    });

    // 新增：处理双侧测试数据
    bilateralTests.forEach(testId => {
      const leftScore = scores[`${testId}-left`];
      const rightScore = scores[`${testId}-right`];
      const baseTestScore = scores[testId];
      
      if (leftScore !== undefined && rightScore !== undefined) {
        // 保存所有双侧数据到baseScores（用于后续处理）
        baseScores[`${testId}-left`] = leftScore;
        baseScores[`${testId}-right`] = rightScore;
        
        // 检查是否为1分/0分组合
        if ((leftScore === 1 && rightScore === 0) || (leftScore === 0 && rightScore === 1)) {
          console.log(`🏥 检测到1分/0分组合: ${testId} (左${leftScore}/右${rightScore})`);
          // 0分侧已经在basePainTests中处理
          // 将1分侧记录为疼痛解决后需要处理的残余功能障碍
          const dysfunctionSide = leftScore === 1 ? 'left' : 'right';
          pendingDysfunctionAfterPain.push(`${testId}-${dysfunctionSide}-residual`);
          console.log(`📝 添加残余功能障碍处理: ${testId}-${dysfunctionSide}-residual`);
        }
      } else if (baseTestScore !== undefined && baseTestScore > 0) {
        // 修复：当有总分但没有双侧数据时，假设左右侧对称
        console.log(`🔧 修复双侧数据缺失: ${testId} 总分${baseTestScore}，假设左右侧对称`);
        baseScores[`${testId}-left`] = baseTestScore;
        baseScores[`${testId}-right`] = baseTestScore;
      }
    });

    console.log('📊 解析结果:', {
      baseScores,
      clearancePainTests,
      basePainTests,
      pendingDysfunctionAfterPain
    });
    
    return { baseScores, clearancePainTests, basePainTests, bilateralTests, pendingDysfunctionAfterPain };
  };

  const { baseScores, clearancePainTests, basePainTests, bilateralTests, pendingDysfunctionAfterPain } = parseScores(scores);
  const allPainTests = [...clearancePainTests, ...basePainTests];

  // 阶段1：处理疼痛问题（排除测试阳性和基础测试疼痛）
  if (allPainTests.length > 0) {
    const painPlans: CorrectionPlan[] = [];
    
    // 按优先级排序疼痛测试
    const sortedPainTests = sortTestsByPriority(allPainTests);
    
    // 新增：处理重复的疼痛项目合并逻辑
    const processedTests = new Set<string>();
    
    sortedPainTests.forEach((testId) => {
      const exercises: Exercise[] = []; // 疼痛情况下不提供训练动作
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];
      
      // 检查是否为带侧别标识的测试（如"hurdle-step-right"）
      const isLateralTest = testId.includes('-left') || testId.includes('-right');
      const baseTestId = isLateralTest ? 
        testId.replace('-left', '').replace('-right', '') : 
        testId;
      
      // 如果基础测试已经处理过，跳过（避免重复）
      if (processedTests.has(baseTestId)) {
        return;
      }
      
      // 检查是否有对应的双侧疼痛
      const leftTestId = `${baseTestId}-left`;
      const rightTestId = `${baseTestId}-right`;
      const hasLeftPain = allPainTests.includes(leftTestId);
      const hasRightPain = allPainTests.includes(rightTestId);
      const hasBasePain = allPainTests.includes(baseTestId);
      
      // 确定疼痛侧别
      let painSide: 'left' | 'right' | 'bilateral' | undefined;
      if (hasBasePain) {
        // 如果基础测试本身有疼痛，则为bilateral
        painSide = 'bilateral';
      } else if (hasLeftPain && hasRightPain) {
        painSide = 'bilateral';
      } else if (hasLeftPain) {
        painSide = 'left';
      } else if (hasRightPain) {
        painSide = 'right';
      }
      
      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'critical',
        testId: baseTestId, // 使用基础testId，不带侧别后缀
        testName: getTestName(baseTestId), // 使用基础名称
        issue: 'pain',
        side: painSide, // 在side字段中记录疼痛侧别
        exercises,
        contraindications,
        strategy: generateStrategy('pain', getTestName(baseTestId)),
        phase: currentPhase
      };
      
      painPlans.push(planItem);
      processedTests.add(baseTestId); // 标记该基础测试已处理
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段一：疼痛处理',
      description: '优先解决所有疼痛问题，确保训练安全性',
      correctionPlans: painPlans,
      estimatedWeeks: 2
    });
  }

  // 新增：阶段1.5 - 处理疼痛解决后的残余功能障碍（1分/0分组合中的1分）
  if (pendingDysfunctionAfterPain.length > 0) {
    const residualPlans: CorrectionPlan[] = [];
    
    // 按优先级排序残余功能障碍：ASLR、SM、RS、HS、ILL
    const sortedResidualIds = pendingDysfunctionAfterPain.sort((a, b) => {
      const getTestIdFromResidual = (residualId: string) => {
        const withoutResidual = residualId.replace('-residual', '');
        const lastDashIndex = withoutResidual.lastIndexOf('-');
        return withoutResidual.substring(0, lastDashIndex);
      };
      
      const testIdA = getTestIdFromResidual(a);
      const testIdB = getTestIdFromResidual(b);
      const priorityA = FMS_TEST_PRIORITY[testIdA as keyof typeof FMS_TEST_PRIORITY] || 999;
      const priorityB = FMS_TEST_PRIORITY[testIdB as keyof typeof FMS_TEST_PRIORITY] || 999;
      return priorityA - priorityB;
    });
    
    sortedResidualIds.forEach((residualId) => {
      // 修复：正确解析residualId格式："testId-side-residual"
      const withoutResidual = residualId.replace('-residual', ''); // 去掉 "-residual"
      const lastDashIndex = withoutResidual.lastIndexOf('-'); // 找到最后一个'-'
      const testId = withoutResidual.substring(0, lastDashIndex); // testId部分
      const side = withoutResidual.substring(lastDashIndex + 1); // side部分
      
      console.log(`🔧 解析residualId: ${residualId} -> testId: ${testId}, side: ${side}`);
      
      const sideName = side === 'left' ? '左侧' : '右侧';
      const exercises = FMS_EXERCISES[testId as keyof typeof FMS_EXERCISES] || [];
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'high',
        testId,
        testName: getTestName(testId),
        issue: 'dysfunction',
        side: side as 'left' | 'right',
        exercises,
        contraindications,
        strategy: `疼痛解决后，针对${sideName}的残余功能障碍进行专项纠正训练。建议在疼痛完全缓解后重新评估整体动作模式。`,
        phase: currentPhase
      };
      residualPlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段1.5：疼痛后残余功能障碍处理',
      description: '处理疼痛解决后遗留的功能障碍，建议重新评估以确认真实的功能状态',
      prerequisite: '疼痛问题完全解决后',
      correctionPlans: residualPlans,
      estimatedWeeks: 3
    });
  }

  // 从此开始，假设疼痛已经解决，基于基础测试分数继续处理
  const effectiveScores: Record<string, number> = { ...baseScores };

  // 阶段2：处理包含1分的不对称（功能障碍性不对称）
  // 文档要求：ASLR, SM, RS, HS, ILL
  const asymmetryWithDysfunction: Array<{testId: string, leftScore: number, rightScore: number}> = [];
  
  bilateralTests.forEach(testId => {
    const leftScore = effectiveScores[`${testId}-left`];
    const rightScore = effectiveScores[`${testId}-right`];
    
    if (leftScore !== undefined && rightScore !== undefined && leftScore !== rightScore) {
      if (leftScore === 1 || rightScore === 1) {
        // 检查是否已经在阶段1.5处理过（1分/0分组合的残余）
        const isResidualFromPain = pendingDysfunctionAfterPain.some(residual => 
          residual.startsWith(testId) && 
          ((leftScore === 1 && rightScore === 0) || (leftScore === 0 && rightScore === 1))
        );
        
        if (!isResidualFromPain) {
          asymmetryWithDysfunction.push({testId, leftScore, rightScore});
        }
      }
    }
  });

  if (asymmetryWithDysfunction.length > 0) {
    const asymmetryPlans: CorrectionPlan[] = [];
    
    // 按优先级排序：ASLR, SM, RS, HS, ILL
    const sortedAsymmetryTests = sortTestsByPriority(asymmetryWithDysfunction.map(a => a.testId));
    
    sortedAsymmetryTests.forEach(testId => {
      const asymmetryData = asymmetryWithDysfunction.find(a => a.testId === testId);
      if (!asymmetryData) return;
      
      const { leftScore, rightScore } = asymmetryData;
      // 纠正方案集中于得分为1的那一侧
      const dysfunctionSide = leftScore === 1 ? 'left' : rightScore === 1 ? 'right' : 'bilateral';
      const exercises: Exercise[] = FMS_EXERCISES[testId as keyof typeof FMS_EXERCISES] || [];
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'high',
        testId,
        testName: getTestName(testId),
        issue: 'asymmetry_with_dysfunction',
        side: dysfunctionSide,
        exercises,
        contraindications,
        strategy: generateStrategy('asymmetry_with_dysfunction', getTestName(testId), dysfunctionSide),
        phase: currentPhase
      };
      asymmetryPlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段二：功能障碍性不对称纠正',
      description: '解决包含1分的不对称问题，恢复基本功能',
      prerequisite: allPainTests.length > 0 ? '疼痛问题解决后' : undefined,
      correctionPlans: asymmetryPlans,
      estimatedWeeks: 4
    });
  }

  // 阶段3：处理小四项的对称1分（ASLR, SM, RS, TSPU）
  // 文档要求：只有在所有不对称1分解决后，才处理对称1分
  const smallFourSymmetricDysfunction: string[] = [];
  
  // 检查小四项的对称1分（未在阶段2处理的）
  ['active-straight-leg-raise', 'shoulder-mobility', 'rotary-stability', 'trunk-stability-push-up'].forEach(testId => {
    const score = effectiveScores[testId];
    if (score === 1) {
      // 确保这个项目没有在阶段2（不对称）中处理过
      const wasHandledInPhase2 = asymmetryWithDysfunction.some(a => a.testId === testId);
      if (!wasHandledInPhase2) {
        smallFourSymmetricDysfunction.push(testId);
      }
    }
  });

  if (smallFourSymmetricDysfunction.length > 0) {
    const smallFourPlans: CorrectionPlan[] = [];
    const sortedSmallFourTests = sortTestsByPriority(smallFourSymmetricDysfunction);

    sortedSmallFourTests.forEach(testId => {
      const exercises = FMS_EXERCISES[testId as keyof typeof FMS_EXERCISES] || [];
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'medium',
        testId,
        testName: getTestName(testId),
        issue: 'dysfunction',
        side: 'bilateral',
        exercises,
        contraindications,
        strategy: generateStrategy('dysfunction', getTestName(testId)),
        phase: currentPhase
      };
      smallFourPlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段三：小四项对称功能障碍纠正',
      description: '解决小四项（ASLR、SM、RS、TSPU）的对称性功能障碍',
      prerequisite: phases.length > 0 ? '前期问题解决后' : undefined,
      correctionPlans: smallFourPlans,
      estimatedWeeks: 6
    });
  }

  // 阶段4：处理大三项的对称1分（HS, ILL, DS）
  const bigThreeSymmetricDysfunction: string[] = [];
  
  ['hurdle-step', 'inline-lunge', 'deep-squat'].forEach(testId => {
    const score = effectiveScores[testId];
    if (score === 1) {
      const wasHandledInPhase2 = asymmetryWithDysfunction.some(a => a.testId === testId);
      if (!wasHandledInPhase2) {
        bigThreeSymmetricDysfunction.push(testId);
      }
    }
  });

  if (bigThreeSymmetricDysfunction.length > 0) {
    const bigThreePlans: CorrectionPlan[] = [];
    const sortedBigThreeTests = sortTestsByPriority(bigThreeSymmetricDysfunction);

    sortedBigThreeTests.forEach(testId => {
      const exercises = FMS_EXERCISES[testId as keyof typeof FMS_EXERCISES] || [];
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'medium',
        testId,
        testName: getTestName(testId),
        issue: 'dysfunction',
        side: 'bilateral',
        exercises,
        contraindications,
        strategy: generateStrategy('dysfunction', getTestName(testId)),
        phase: currentPhase
      };
      bigThreePlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段四：大三项对称功能障碍纠正',
      description: '解决大三项（HS、ILL、DS）的对称性功能障碍',
      prerequisite: phases.length > 0 ? '前期问题解决后' : undefined,
      correctionPlans: bigThreePlans,
      estimatedWeeks: 6
    });
  }

  // 阶段5：处理表现性不对称（不含1分的不对称）
  const performanceAsymmetry: Array<{testId: string, leftScore: number, rightScore: number}> = [];
  
  bilateralTests.forEach(testId => {
    const leftScore = effectiveScores[`${testId}-left`];
    const rightScore = effectiveScores[`${testId}-right`];
    
    if (leftScore !== undefined && rightScore !== undefined && leftScore !== rightScore) {
      if (leftScore > 1 && rightScore > 1) {
        // 检查是否已经在前面阶段处理过
        const wasHandled = phases.some(phase => 
          phase.correctionPlans.some(p => p.testId === testId)
        );
        if (!wasHandled) {
          performanceAsymmetry.push({testId, leftScore, rightScore});
        }
      }
    }
  });

  if (performanceAsymmetry.length > 0) {
    const performancePlans: CorrectionPlan[] = [];
    const sortedPerformanceTests = sortTestsByPriority(performanceAsymmetry.map(a => a.testId));

    sortedPerformanceTests.forEach(testId => {
      const asymmetryData = performanceAsymmetry.find(a => a.testId === testId);
      if (!asymmetryData) return;

      const { leftScore, rightScore } = asymmetryData;
      const weakerSide = leftScore < rightScore ? 'left' : 'right';
      const exercises = FMS_EXERCISES[testId as keyof typeof FMS_EXERCISES] || [];
      const contraindications = TRAINING_CONTRAINDICATIONS[testId as keyof typeof TRAINING_CONTRAINDICATIONS];

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'low',
        testId,
        testName: getTestName(testId),
        issue: 'asymmetry_performance',
        side: weakerSide,
        exercises,
        contraindications,
        strategy: generateStrategy('asymmetry_performance', getTestName(testId), weakerSide),
        phase: currentPhase
      };
      performancePlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段五：表现性不对称纠正',
      description: '改善不含功能障碍的表现性不对称，提升动作对称性',
      prerequisite: phases.length > 0 ? '前期问题解决后' : undefined,
      correctionPlans: performancePlans,
      estimatedWeeks: 4
    });
  }

  // 阶段6：处理2分优化 - 合并对称的2分项目
  const improvementTests: string[] = [];
  const processedBilateralTests = new Set<string>();

  // 收集所有2分项目（排除已在前面阶段处理的）
  console.log('🔍 阶段6 - 开始处理2分项目，effectiveScores:', effectiveScores);
  console.log('🔍 阶段6 - 双侧测试列表:', bilateralTests);
  console.log('🔍 阶段6 - 已有阶段数:', phases.length);

  Object.entries(effectiveScores).forEach(([testId, score]) => {
    if (score === 2) {
      console.log(`🔍 阶段6 - 发现2分项目: ${testId}`);
      
      // 检查是否已经在前面的阶段处理过
      const alreadyHandled = phases.some(phase => 
        phase.correctionPlans.some(p => p.testId === testId || testId.startsWith(p.testId))
      );
      
      console.log(`🔍 阶段6 - ${testId} 是否已处理: ${alreadyHandled}`);
      
      if (!alreadyHandled) {
        // 检查是否为双侧测试的侧别数据
        const isLateralTest = testId.includes('-left') || testId.includes('-right');
        const baseTestId = isLateralTest ? 
          testId.replace('-left', '').replace('-right', '') : 
          testId;
        
        console.log(`🔍 阶段6 - ${testId} -> 基础测试: ${baseTestId}, 是侧别测试: ${isLateralTest}`);
        
        if (bilateralTests.includes(baseTestId) && !processedBilateralTests.has(baseTestId)) {
          // 检查双侧是否都是2分
          const leftScore = effectiveScores[`${baseTestId}-left`];
          const rightScore = effectiveScores[`${baseTestId}-right`];
          
          console.log(`🔍 阶段6 - ${baseTestId} 双侧分数: 左${leftScore}/右${rightScore}`);
          
          if (leftScore === 2 && rightScore === 2) {
            // 合并为一个双侧项目
            console.log(`✅ 阶段6 - 合并双侧项目: ${baseTestId}`);
            improvementTests.push(baseTestId);
            processedBilateralTests.add(baseTestId);
          } else if (isLateralTest) {
            // 只有一侧是2分，保持单侧处理
            console.log(`✅ 阶段6 - 添加单侧项目: ${testId}`);
            improvementTests.push(testId);
          }
        } else if (!bilateralTests.includes(baseTestId)) {
          // 单侧测试，直接添加
          console.log(`✅ 阶段6 - 添加单侧测试: ${testId}`);
          improvementTests.push(testId);
        }
      }
    }
  });

  console.log('🔍 阶段6 - 最终improvementTests:', improvementTests);

  if (improvementTests.length > 0) {
    const improvementPlans: CorrectionPlan[] = [];
    const sortedImprovementTests = sortTestsByPriority(improvementTests);

    sortedImprovementTests.forEach((testId) => {
      // 对于双侧测试，需要获取基础测试名称
      const baseTestId = bilateralTests.find(bt => testId.startsWith(bt) || testId === bt) || testId;
      const exercises = FMS_EXERCISES[baseTestId as keyof typeof FMS_EXERCISES] || [];

      // 确定侧别
      let side: 'left' | 'right' | 'bilateral' = 'bilateral';
      if (testId.includes('-left')) {
        side = 'left';
      } else if (testId.includes('-right')) {
        side = 'right';
      } else if (bilateralTests.includes(testId)) {
        // 这是合并的双侧项目
        side = 'bilateral';
      }

      const planItem: CorrectionPlan = {
        step: stepCounter++,
        priority: 'low',
        testId: baseTestId,
        testName: getTestName(baseTestId),
        issue: 'improvement',
        side,
        exercises,
        strategy: generateStrategy('improvement', getTestName(baseTestId)),
        phase: currentPhase
      };
      improvementPlans.push(planItem);
    });

    phases.push({
      phase: currentPhase++,
      title: '阶段六：动作质量优化',
      description: '追求动作的完美表现，进一步提升训练效果',
      prerequisite: phases.length > 0 ? '前期问题解决后' : undefined,
      correctionPlans: improvementPlans,
      estimatedWeeks: 3
    });
  }

  // 计算总体统计
  const totalSteps = stepCounter - 1;
  const estimatedWeeks = phases.reduce((total, phase) => total + phase.estimatedWeeks, 0);
  const hasPainIssues = allPainTests.length > 0;

  console.log('✅ 算法生成结果:', {
    phases: phases.length,
    totalSteps,
    estimatedWeeks,
    hasPainIssues
  });

  return {
    phases,
    totalSteps,
    estimatedWeeks,
    hasPainIssues
  };
};

// 导出类型
export type { 
  ComprehensiveTrainingPlan, 
  TrainingPhase, 
  CorrectionPlan, 
  Exercise, 
  Contraindication 
}; 