import { describe, it, expect } from 'vitest';
import { generateComprehensiveTrainingPlan } from '@/lib/trainingAlgorithm';
import type { ComprehensiveTrainingPlan } from '@/lib/trainingAlgorithm';

/**
 * FMS训练算法全面测试套件
 * 测试所有可能的得分组合和处理逻辑
 */

describe('FMS训练算法全面测试', () => {
  
  describe('双侧测试得分组合处理', () => {
    
    describe('疼痛组合测试（包含0分）', () => {
      
      it('应该正确处理左1分/右0分组合', () => {
        const testScores = {
          'shoulder-mobility': 0, // 最终得分取低分
          'shoulder-mobility-left': 1,
          'shoulder-mobility-right': 0
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证应该有疼痛处理阶段
        expect(plan.hasPainIssues).toBe(true);
        expect(plan.phases.length).toBeGreaterThanOrEqual(2);
        
        // 验证阶段顺序和内容
        const phase1 = plan.phases[0];
        expect(phase1.title).toContain('疼痛处理');
        expect(phase1.correctionPlans.some(p => p.issue === 'pain')).toBe(true);
        
        // 验证阶段1.5存在且处理残余功能障碍
        if (plan.phases.length >= 2) {
          const phase15 = plan.phases[1];
          expect(phase15.title).toContain('残余功能障碍');
          expect(phase15.prerequisite).toContain('疼痛');
          expect(phase15.correctionPlans.some(p => p.side === 'left')).toBe(true);
        }
      });

      it('应该正确处理左0分/右1分组合', () => {
        const testScores = {
          'active-straight-leg-raise': 0, // 最终得分取低分
          'active-straight-leg-raise-left': 0,
          'active-straight-leg-raise-right': 1
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证疼痛处理和残余功能障碍处理
        expect(plan.hasPainIssues).toBe(true);
        expect(plan.phases.length).toBeGreaterThanOrEqual(2);
        
        // 验证阶段1.5针对右侧
        if (plan.phases.length >= 2) {
          const phase15 = plan.phases[1];
          expect(phase15.correctionPlans.some(p => p.side === 'right')).toBe(true);
        }
      });

      it('应该正确处理双侧0分（双侧疼痛）', () => {
        const testScores = {
          'rotary-stability': 0,
          'rotary-stability-left': 0,
          'rotary-stability-right': 0
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证只有疼痛处理阶段，没有阶段1.5
        expect(plan.hasPainIssues).toBe(true);
        expect(plan.phases.length).toBe(1);
        expect(plan.phases[0].title).toContain('疼痛处理');
      });

      it('应该正确处理跨栏步左1分/右0分组合', () => {
        const testScores = {
          'hurdle-step': 0, // 最终得分取低分
          'hurdle-step-left': 1,
          'hurdle-step-right': 0
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证疼痛处理和残余功能障碍处理
        expect(plan.hasPainIssues).toBe(true);
        expect(plan.phases.length).toBeGreaterThanOrEqual(2);
        
        // 验证阶段1：疼痛处理
        const phase1 = plan.phases[0];
        expect(phase1.title).toContain('疼痛处理');
        
        // 新增：验证疼痛阶段中的testName是否正确显示为中文
        const painPlans = phase1.correctionPlans;
        console.log('🔍 疼痛阶段correctionPlans:', painPlans.map(p => ({
          testId: p.testId,
          testName: p.testName,
          issue: p.issue
        })));
        
        // 验证疼痛处理中的跨栏步项目显示为中文
        const hurdleStepPainPlan = painPlans.find(p => p.testId.includes('hurdle-step'));
        expect(hurdleStepPainPlan).toBeDefined();
        expect(hurdleStepPainPlan?.testName).toContain('跨栏步');
        
        // 验证阶段1.5：残余功能障碍处理（左侧1分）
        if (plan.phases.length >= 2) {
          const phase15 = plan.phases[1];
          expect(phase15.title).toContain('疼痛后残余功能障碍处理');
          expect(phase15.correctionPlans.some(p => 
            p.testName === '跨栏步' && p.side === 'left' && p.issue === 'dysfunction'
          )).toBe(true);
        }
      });

      it('应该正确处理排除测试影响的组合', () => {
        const testScores = {
          'shoulder-impingement-clearance': 0, // 排除测试阳性
          'shoulder-mobility': 1, // 基础测试受影响
          'shoulder-mobility-left': 1,
          'shoulder-mobility-right': 1
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证处理排除测试疼痛，但没有阶段1.5
        expect(plan.hasPainIssues).toBe(true);
        expect(plan.phases[0].title).toContain('疼痛处理');
        expect(plan.phases[0].correctionPlans.some(p => 
          p.testName.includes('肩部撞击')
        )).toBe(true);
      });
    });

    describe('功能障碍性不对称测试（不含0分）', () => {
      
      it('应该正确处理左1分/右2分组合', () => {
        const testScores = {
          'hurdle-step': 1, // 最终得分取低分
          'hurdle-step-left': 1,
          'hurdle-step-right': 2
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        // 验证基本结构
        validateTrainingPlan(plan);
        
        // 验证没有疼痛问题
        expect(plan.hasPainIssues).toBe(false);
        
        // 验证有功能障碍性不对称处理
        expect(plan.phases.length).toBeGreaterThanOrEqual(1);
        const asymmetryPhase = plan.phases.find(p => p.title.includes('不对称'));
        expect(asymmetryPhase).toBeDefined();
        expect(asymmetryPhase?.correctionPlans.some(p => 
          p.issue === 'asymmetry_with_dysfunction' && p.side === 'left'
        )).toBe(true);
      });

      it('应该正确处理左2分/右1分组合', () => {
        const testScores = {
          'inline-lunge': 1,
          'inline-lunge-left': 2,
          'inline-lunge-right': 1
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        validateTrainingPlan(plan);
        expect(plan.hasPainIssues).toBe(false);
        
        const asymmetryPhase = plan.phases.find(p => p.title.includes('不对称'));
        expect(asymmetryPhase?.correctionPlans.some(p => 
          p.issue === 'asymmetry_with_dysfunction' && p.side === 'right'
        )).toBe(true);
      });

      it('应该正确处理左1分/右3分组合', () => {
        const testScores = {
          'shoulder-mobility': 1,
          'shoulder-mobility-left': 1,
          'shoulder-mobility-right': 3
        };
        
        const plan = generateComprehensiveTrainingPlan(testScores);
        
        validateTrainingPlan(plan);
        expect(plan.hasPainIssues).toBe(false);
        
        const asymmetryPhase = plan.phases.find(p => p.title.includes('不对称'));
        expect(asymmetryPhase?.correctionPlans.some(p => 
          p.issue === 'asymmetry_with_dysfunction' && p.side === 'left'
        )).toBe(true);
      });
    });
  });

  describe('复杂组合场景测试', () => {
    
    it('应该正确处理多项目混合场景', () => {
      const testScores = {
        // 疼痛
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0,
        
        // 功能障碍性不对称
        'hurdle-step': 1,
        'hurdle-step-left': 1,
        'hurdle-step-right': 2,
        
        // 排除测试
        'shoulder-impingement-clearance': 0
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      validateTrainingPlan(plan);
      
      // 验证复杂场景的处理
      expect(plan.hasPainIssues).toBe(true);
      expect(plan.phases.length).toBeGreaterThanOrEqual(3); // 至少3个阶段
      
      // 验证阶段顺序：疼痛 → 残余功能障碍 → 不对称
      expect(plan.phases[0].title).toContain('疼痛');
      expect(plan.phases[1].title).toContain('残余功能障碍');
      
      // 验证不会在阶段二重复处理已在阶段1.5处理的项目
      const phase2 = plan.phases.find(p => p.title.includes('阶段二'));
      if (phase2) {
        expect(phase2.correctionPlans.some(p => 
          p.testName.includes('肩关节活动度')
        )).toBe(false); // 肩关节活动度已在阶段1.5处理
      }
    });

    it('应该正确处理优先级排序', () => {
      const testScores = {
        // 按优先级：ASLR(1), SM(2), RS(3), HS(5), ILL(6)
        'active-straight-leg-raise': 1,
        'active-straight-leg-raise-left': 1,
        'active-straight-leg-raise-right': 2,
        
        'shoulder-mobility': 1,
        'shoulder-mobility-left': 2,
        'shoulder-mobility-right': 1,
        
        'rotary-stability': 1,
        'rotary-stability-left': 1,
        'rotary-stability-right': 3
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      validateTrainingPlan(plan);
      
      // 验证处理顺序按照优先级
      const asymmetryPhase = plan.phases.find(p => p.title.includes('不对称'));
      if (asymmetryPhase && asymmetryPhase.correctionPlans.length >= 3) {
        const testOrder = asymmetryPhase.correctionPlans.map(p => p.testName);
        const aslrIndex = testOrder.findIndex(name => name.includes('主动直腿'));
        const smIndex = testOrder.findIndex(name => name.includes('肩关节'));
        const rsIndex = testOrder.findIndex(name => name.includes('旋转'));
        
        // ASLR应该在SM之前，SM应该在RS之前
        expect(aslrIndex).toBeLessThan(smIndex);
        expect(smIndex).toBeLessThan(rsIndex);
      }
    });
  });

  describe('阶段过渡和依赖关系测试', () => {
    
    it('阶段1.5应该依赖于阶段一完成', () => {
      const testScores = {
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      if (plan.phases.length >= 2) {
        const phase15 = plan.phases[1];
        expect(phase15.prerequisite).toBeDefined();
        expect(phase15.prerequisite).toContain('疼痛');
      }
    });

    it('后续阶段不应该重复处理阶段1.5的项目', () => {
      const testScores = {
        // 1分/0分组合 + 正常不对称
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0,
        
        'hurdle-step': 1,
        'hurdle-step-left': 1,
        'hurdle-step-right': 2
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      // 查找所有处理肩关节活动度的阶段
      const shoulderPlans = plan.phases.flatMap(phase => 
        phase.correctionPlans.filter(p => p.testName.includes('肩关节'))
      );
      
      // 检查不同阶段中的肩关节处理情况
      const painPhaseShoulderPlans = plan.phases[0]?.correctionPlans.filter(p => p.testName.includes('肩关节')) || [];
      const phase15ShoulderPlans = plan.phases[1]?.correctionPlans.filter(p => p.testName.includes('肩关节')) || [];
      
      // 验证：
      // 1. 阶段一处理疼痛（issue: 'pain'）
      // 2. 阶段1.5处理残余功能障碍（issue: 'dysfunction', side: 'left'）
      // 这是合理的，因为它们处理的是不同方面的问题
      
      expect(painPhaseShoulderPlans.length).toBe(1); // 疼痛处理
      expect(painPhaseShoulderPlans[0].issue).toBe('pain');
      
      expect(phase15ShoulderPlans.length).toBe(1); // 残余功能障碍处理
      expect(phase15ShoulderPlans[0].issue).toBe('dysfunction');
      expect(phase15ShoulderPlans[0].side).toBe('left');
      
      // 验证这些是针对不同问题的合理处理，不是重复
      expect(shoulderPlans.length).toBe(2); // 两个不同的处理阶段
    });

    it('应该正确计算总体训练时间', () => {
      const testScores = {
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      const expectedWeeks = plan.phases.reduce((total, phase) => total + phase.estimatedWeeks, 0);
      expect(plan.estimatedWeeks).toBe(expectedWeeks);
      expect(plan.totalSteps).toBe(plan.phases.reduce((total, phase) => total + phase.correctionPlans.length, 0));
    });
  });

  describe('边界和异常情况测试', () => {
    
    it('应该处理空得分输入', () => {
      const testScores = {};
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      validateTrainingPlan(plan);
      expect(plan.phases.length).toBe(0);
      expect(plan.totalSteps).toBe(0);
      expect(plan.estimatedWeeks).toBe(0);
      expect(plan.hasPainIssues).toBe(false);
    });

    it('应该处理所有满分的情况', () => {
      const testScores = {
        'deep-squat': 3,
        'hurdle-step': 3,
        'hurdle-step-left': 3,
        'hurdle-step-right': 3,
        'inline-lunge': 3,
        'inline-lunge-left': 3,
        'inline-lunge-right': 3
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      validateTrainingPlan(plan);
      expect(plan.phases.length).toBe(0);
      expect(plan.hasPainIssues).toBe(false);
    });

    it('应该处理缺失双侧数据的情况', () => {
      const testScores = {
        'shoulder-mobility': 2
        // 缺少 -left 和 -right 数据
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      // 应该能够优雅处理，自动补充双侧数据并生成训练方案
      validateTrainingPlan(plan);
      expect(plan.phases.length).toBe(1); // 修复后应该生成1个阶段处理2分项目
      expect(plan.phases[0].title).toContain('阶段六：动作质量优化');
    });
  });

  describe('医学逻辑验证', () => {
    
    it('疼痛问题应该始终是最高优先级', () => {
      const testScores = {
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0,
        'hurdle-step': 1,
        'hurdle-step-left': 1,
        'hurdle-step-right': 2
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      // 第一个阶段必须是疼痛处理
      expect(plan.phases[0].title).toContain('疼痛');
      expect(plan.phases[0].correctionPlans.every(p => p.priority === 'critical')).toBe(true);
    });

    it('应该建议疼痛解决后重新评估', () => {
      const testScores = {
        'shoulder-mobility': 0,
        'shoulder-mobility-left': 1,
        'shoulder-mobility-right': 0
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      if (plan.phases.length >= 2) {
        const phase15 = plan.phases[1];
        expect(phase15.description.includes('重新评估') || 
               phase15.correctionPlans.some(p => p.strategy.includes('重新评估'))).toBe(true);
      }
    });

    it('不对称纠正应该针对功能障碍侧', () => {
      const testScores = {
        'hurdle-step': 1,
        'hurdle-step-left': 1,
        'hurdle-step-right': 2
      };
      
      const plan = generateComprehensiveTrainingPlan(testScores);
      
      const asymmetryPhase = plan.phases.find(p => p.title.includes('不对称'));
      if (asymmetryPhase) {
        const hurdleStepPlan = asymmetryPhase.correctionPlans.find(p => 
          p.testName.includes('跨栏步')
        );
        expect(hurdleStepPlan?.side).toBe('left'); // 1分的那一侧
      }
    });
  });

  // 新增测试用例：验证对称2分项目合并功能
  describe('对称2分项目合并功能', () => {
    test('应该合并双侧都是2分的项目', () => {
      const scores = {
        'hurdle-step': 2,
        'hurdle-step-left': 2,
        'hurdle-step-right': 2,
        'inline-lunge': 2,
        'inline-lunge-left': 2,
        'inline-lunge-right': 2
      };

      console.log('🔍 测试对称2分合并:', scores);
      const result = generateComprehensiveTrainingPlan(scores);
      console.log('✅ 合并结果:', result);

      // 应该有一个阶段六：动作质量优化
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].title).toBe('阶段六：动作质量优化');
      
      // 应该只有2个训练项目（合并后的）
      expect(result.phases[0].correctionPlans).toHaveLength(2);
      
      // 验证合并项目都是bilateral
      result.phases[0].correctionPlans.forEach(plan => {
        expect(plan.side).toBe('bilateral');
        expect(['hurdle-step', 'inline-lunge']).toContain(plan.testId);
      });
    });

    test('应该保持单侧2分项目不合并', () => {
      const scores = {
        'hurdle-step': 2,
        'hurdle-step-left': 2,
        'hurdle-step-right': 1, // 一侧不是2分
        'inline-lunge': 2,
        'inline-lunge-left': 1,
        'inline-lunge-right': 2  // 另一侧不是2分
      };

      console.log('🔍 测试单侧2分不合并:', scores);
      const result = generateComprehensiveTrainingPlan(scores);
      console.log('✅ 不合并结果:', result);

      // 可能有多个阶段，因为不对称会在前面处理
      const phase6 = result.phases.find(p => p.title.includes('动作质量优化'));
      if (phase6) {
        // 验证2分的单侧项目确实是单侧处理
        const singleSidePlans = phase6.correctionPlans.filter(p => p.side !== 'bilateral');
        expect(singleSidePlans.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * 测试辅助函数
 */

// 生成测试数据的辅助函数
function generateTestScores(config: {
  bilateralTests?: Record<string, [number, number]>; // [left, right]
  unilateralTests?: Record<string, number>;
  clearanceTests?: Record<string, number>;
}) {
  const scores: Record<string, number> = {};
  
  // 处理双侧测试
  if (config.bilateralTests) {
    Object.entries(config.bilateralTests).forEach(([testId, [left, right]]) => {
      scores[`${testId}-left`] = left;
      scores[`${testId}-right`] = right;
      scores[testId] = Math.min(left, right); // FMS取低分原则
    });
  }
  
  // 处理单侧测试
  if (config.unilateralTests) {
    Object.assign(scores, config.unilateralTests);
  }
  
  // 处理排除测试
  if (config.clearanceTests) {
    Object.assign(scores, config.clearanceTests);
  }
  
  return scores;
}

// 验证训练计划结构的辅助函数
function validateTrainingPlan(plan: ComprehensiveTrainingPlan) {
  expect(plan).toHaveProperty('phases');
  expect(plan).toHaveProperty('totalSteps');
  expect(plan).toHaveProperty('estimatedWeeks');
  expect(plan).toHaveProperty('hasPainIssues');
  
  expect(Array.isArray(plan.phases)).toBe(true);
  expect(typeof plan.totalSteps).toBe('number');
  expect(typeof plan.estimatedWeeks).toBe('number');
  expect(typeof plan.hasPainIssues).toBe('boolean');
  
  // 验证每个阶段的结构
  plan.phases.forEach((phase) => {
    expect(phase).toHaveProperty('phase');
    expect(phase).toHaveProperty('title');
    expect(phase).toHaveProperty('description');
    expect(phase).toHaveProperty('correctionPlans');
    expect(phase).toHaveProperty('estimatedWeeks');
    
    expect(Array.isArray(phase.correctionPlans)).toBe(true);
    
    // 验证每个纠正计划的结构
    phase.correctionPlans.forEach((correctionPlan) => {
      expect(correctionPlan).toHaveProperty('step');
      expect(correctionPlan).toHaveProperty('priority');
      expect(correctionPlan).toHaveProperty('testId');
      expect(correctionPlan).toHaveProperty('testName');
      expect(correctionPlan).toHaveProperty('issue');
      expect(correctionPlan).toHaveProperty('strategy');
      expect(correctionPlan).toHaveProperty('phase');
    });
  });
}

export { generateTestScores, validateTrainingPlan }; 