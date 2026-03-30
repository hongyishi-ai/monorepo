import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FMSDataProcessor } from '@/lib/fms-data-processor';
import { FMSErrorHandler } from '@/lib/fms-error-handler';
import type { FMSAssessmentData } from '@/types/fms-data';

/**
 * FMS数据流完整性测试套件
 * 测试 评估 → 报告 → 训练 的数据传递链路
 */

describe('FMS数据流完整性测试', () => {
  
  let mockRouteState: any;
  let normalizedData: FMSAssessmentData;

  beforeEach(() => {
    // 模拟标准的路由状态数据
    mockRouteState = {
      scores: {
        'deep-squat': 2,
        'hurdle-step': 1,
        'inline-lunge': 2,
        'shoulder-mobility': 1,
        'active-straight-leg-raise': 2,
        'trunk-stability-push-up': 2,
        'rotary-stability': 1,
        'shoulder-impingement-clearance': 1,
        'spinal-flexion-clearance': 0,
        'spinal-extension-clearance': 1
      },
      bilateralScores: {
        'hurdle-step': {
          left: 1,
          right: 2,
          final: 1,
          asymmetryData: {
            hasAsymmetry: true,
            asymmetryLevel: 'moderate',
            riskLevel: 'medium',
            scoreDifference: 1
          }
        },
        'shoulder-mobility': {
          left: 1,
          right: 1,
          final: 1,
          asymmetryData: {
            hasAsymmetry: false,
            asymmetryLevel: 'none',
            riskLevel: 'low',
            scoreDifference: 0
          }
        }
      },
      asymmetryIssues: {
        'hurdle-step': {
          hasAsymmetry: true,
          asymmetryLevel: 'moderate',
          riskLevel: 'medium'
        }
      },
      painfulTests: ['spinal-flexion-clearance'],
      basicTests: ['deep-squat', 'hurdle-step', 'inline-lunge', 'shoulder-mobility', 'active-straight-leg-raise', 'trunk-stability-push-up', 'rotary-stability'],
      clearanceTests: ['shoulder-impingement-clearance', 'spinal-flexion-clearance', 'spinal-extension-clearance']
    };
  });

  describe('数据标准化和验证', () => {
    
    it('应该正确标准化路由状态数据', () => {
      const normalized = FMSDataProcessor.normalizeRouteState(mockRouteState);
      
      expect(normalized).toBeDefined();
      expect(normalized.sessionId).toMatch(/^fms_\d+_[a-z0-9]+$/);
      expect(normalized.timestamp).toBeInstanceOf(Date);
      expect(normalized.basicScores).toEqual({
        'deep-squat': 2,
        'hurdle-step': 1,
        'inline-lunge': 2,
        'shoulder-mobility': 1,
        'active-straight-leg-raise': 2,
        'trunk-stability-push-up': 2,
        'rotary-stability': 1
      });
      expect(normalized.totalScore).toBe(11);
      expect(normalized.painfulTests).toContain('spinal-flexion-clearance');
    });

    it('应该正确处理双侧分数数据', () => {
      const normalized = FMSDataProcessor.normalizeRouteState(mockRouteState);
      
      expect(normalized.bilateralScores['hurdle-step']).toEqual({
        left: 1,
        right: 2,
        final: 1,
        asymmetryData: {
          hasAsymmetry: true,
          asymmetryLevel: 'moderate',
          riskLevel: 'medium',
          scoreDifference: 1
        }
      });
    });

    it('应该正确处理排除测试结果', () => {
      const normalized = FMSDataProcessor.normalizeRouteState(mockRouteState);
      
      expect(normalized.clearanceResults).toHaveLength(3);
      
      const spinalFlexionResult = normalized.clearanceResults.find(r => r.testId === 'spinal-flexion-clearance');
      expect(spinalFlexionResult).toEqual({
        testId: 'spinal-flexion-clearance',
        isPositive: true, // 0分表示阳性
        affectedBaseTest: 'rotary-stability'
      });
    });

    it('应该生成正确的风险标记', () => {
      const normalized = FMSDataProcessor.normalizeRouteState(mockRouteState);
      
      expect(normalized.riskFlags).toContain('PAIN_PRESENT');
      expect(normalized.riskFlags).toContain('MULTIPLE_DYSFUNCTION'); // 3个1分项目
    });
  });

  describe('训练数据准备', () => {
    
    beforeEach(() => {
      normalizedData = FMSDataProcessor.normalizeRouteState(mockRouteState);
    });

    it('应该正确准备训练算法所需的数据格式', () => {
      const trainingData = FMSDataProcessor.prepareForTraining(normalizedData);
      
      // 检查基础分数
      expect(trainingData['deep-squat']).toBe(2);
      expect(trainingData['hurdle-step']).toBe(1);
      
      // 检查排除测试分数
      expect(trainingData['spinal-flexion-clearance']).toBe(0);
      expect(trainingData['shoulder-impingement-clearance']).toBe(1);
      
      // 检查双侧分数展开
      expect(trainingData['hurdle-step-left']).toBe(1);
      expect(trainingData['hurdle-step-right']).toBe(2);
      expect(trainingData['shoulder-mobility-left']).toBe(1);
      expect(trainingData['shoulder-mobility-right']).toBe(1);
    });

    it('应该正确处理1分/0分组合的特殊情况', () => {
      // 创建1分/0分组合的测试数据
      const specialCaseData = {
        ...mockRouteState,
        scores: {
          ...mockRouteState.scores,
          'active-straight-leg-raise': 0 // 最终分数为0
        },
        bilateralScores: {
          ...mockRouteState.bilateralScores,
          'active-straight-leg-raise': {
            left: 1,
            right: 0,
            final: 0,
            asymmetryData: {
              hasAsymmetry: true,
              asymmetryLevel: 'severe',
              riskLevel: 'high',
              scoreDifference: 1
            }
          }
        },
        painfulTests: [...mockRouteState.painfulTests, 'active-straight-leg-raise']
      };

      const normalized = FMSDataProcessor.normalizeRouteState(specialCaseData);
      const trainingData = FMSDataProcessor.prepareForTraining(normalized);
      
      expect(trainingData['active-straight-leg-raise']).toBe(0);
      expect(trainingData['active-straight-leg-raise-left']).toBe(1);
      expect(trainingData['active-straight-leg-raise-right']).toBe(0);
    });
  });

  describe('错误处理和数据恢复', () => {
    
    it('应该正确验证完整的路由状态', () => {
      const validation = FMSErrorHandler.validateRouteState(mockRouteState);
      
      expect(validation.isValid).toBe(true);
      expect(validation.canProceed).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该处理缺失分数数据的情况', () => {
      const incompleteState = { ...mockRouteState };
      delete incompleteState.scores;
      
      const validation = FMSErrorHandler.validateRouteState(incompleteState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('缺少评估分数数据');
      expect(validation.canProceed).toBe(true); // 通过sanitizedData可以继续
      expect(validation.sanitizedData.scores).toEqual({});
    });

         it('应该处理双侧数据格式错误', () => {
       const corruptState = {
         ...mockRouteState,
         bilateralScores: "invalid_data"
       };
       
       const validation = FMSErrorHandler.validateRouteState(corruptState);
       
       expect(validation.isValid).toBe(false);
       expect(validation.errors).toContain('双侧测试数据格式错误');
       expect(validation.canProceed).toBe(true);
       expect(validation.sanitizedData).toBeDefined();
     });

    it('应该执行数据完整性检查', () => {
      const invalidScoreData = {
        ...mockRouteState,
        scores: {
          ...mockRouteState.scores,
          'deep-squat': 5 // 超出范围
        },
        bilateralScores: {
          'hurdle-step': {
            left: 1,
            right: 2,
            final: 3, // 不一致的最终分数
            asymmetryData: {}
          }
        }
      };

      const check = FMSErrorHandler.performIntegrityCheck(invalidScoreData);
      
      expect(check.passed).toBe(false);
      expect(check.issues).toHaveLength(2);
      expect(check.issues[0].severity).toBe('error');
      expect(check.issues[0].message).toContain('deep-squat分数无效');
      expect(check.issues[1].severity).toBe('warning');
      expect(check.issues[1].message).toContain('hurdle-step最终分数不一致');
    });
  });

  describe('数据持久化和恢复', () => {
    
    beforeEach(() => {
      // 清理localStorage
      localStorage.clear();
    });

    it('应该正确保存评估数据', () => {
      FMSErrorHandler.saveAssessmentData(mockRouteState, 'AssessmentPage');
      
      const saved = localStorage.getItem('fms_last_assessment');
      expect(saved).toBeDefined();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.source).toBe('AssessmentPage');
      expect(parsed.data.sessionId).toBeDefined();
    });

    it('应该正确恢复保存的数据', () => {
      FMSErrorHandler.saveAssessmentData(mockRouteState, 'test');
      
      const recovered = FMSErrorHandler.getSavedAssessmentData();
      expect(recovered).toBeDefined();
      expect(recovered!.basicScores['deep-squat']).toBe(2);
    });

    it('应该处理localStorage错误', () => {
      // 模拟localStorage异常
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      // 不应该抛出错误
      expect(() => {
        FMSErrorHandler.saveAssessmentData(mockRouteState, 'test');
      }).not.toThrow();

      // 恢复原始方法
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('导航错误处理', () => {
    
    it('应该处理缺失分数的导航错误', () => {
      const error = new Error('scores is undefined');
      const recovery = FMSErrorHandler.handleNavigationError(error, 'TrainingPage');
      
      expect(recovery.errorMessage).toBe('评估分数数据丢失');
      expect(recovery.recoveryOptions).toContain('重新进行评估');
      expect(recovery.recoveryOptions).toContain('返回首页重新开始');
    });

    it('应该在有保存数据时提供恢复选项', () => {
      // 先保存一些数据
      FMSErrorHandler.saveAssessmentData(mockRouteState, 'test');
      
      const error = new Error('Navigation failed');
      const recovery = FMSErrorHandler.handleNavigationError(error, 'ReportPage');
      
      expect(recovery.canRecover).toBe(true);
      expect(recovery.fallbackData).toBeDefined();
      expect(recovery.recoveryOptions).toContain('从本地存储恢复数据');
    });
  });

  describe('数据验证完整性', () => {
    
    it('应该验证FMSAssessmentData的完整性', () => {
      const assessmentData = FMSDataProcessor.normalizeRouteState(mockRouteState);
      const validation = FMSDataProcessor.validateAssessmentData(assessmentData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测分数超出范围的问题', () => {
      const invalidData = FMSDataProcessor.normalizeRouteState({
        ...mockRouteState,
        scores: { 'deep-squat': 5 }
      });
      
      const validation = FMSDataProcessor.validateAssessmentData(invalidData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('deep-squat分数超出范围: 5');
    });

    it('应该检测双侧分数不一致的警告', () => {
      const inconsistentData = {
        ...mockRouteState,
        bilateralScores: {
          'hurdle-step': {
            left: 2,
            right: 3,
            final: 1, // 应该是2
            asymmetryData: {}
          }
        }
      };
      
      const assessmentData = FMSDataProcessor.normalizeRouteState(inconsistentData);
      const validation = FMSDataProcessor.validateAssessmentData(assessmentData);
      
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0]).toContain('hurdle-step最终分数可能不正确');
    });
  });

  describe('性能和边界情况', () => {
    
    it('应该处理空数据', () => {
      const emptyData = FMSDataProcessor.normalizeRouteState({});
      
      expect(emptyData.basicScores).toEqual({});
      expect(emptyData.bilateralScores).toEqual({});
      expect(emptyData.painfulTests).toEqual([]);
    });

         it('应该处理大量数据', () => {
       const largeDataSet: any = {
         scores: {},
         bilateralScores: {},
         asymmetryIssues: {}
       };
       
       // 创建100个测试项目
       for (let i = 0; i < 100; i++) {
         largeDataSet.scores[`test-${i}`] = Math.floor(Math.random() * 4);
       }
      
      const start = performance.now();
      const normalized = FMSDataProcessor.normalizeRouteState(largeDataSet);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // 应该在100ms内完成
      expect(normalized).toBeDefined();
    });

    it('应该处理恶意数据', () => {
      const maliciousData = {
        scores: {
          '__proto__': 'hacked',
          'constructor': 'malicious'
        },
        bilateralScores: {
          '<script>alert("xss")</script>': {}
        }
      };
      
      expect(() => {
        FMSDataProcessor.normalizeRouteState(maliciousData);
      }).not.toThrow();
    });
  });
}); 