import { describe, it, expect } from 'vitest';
import { 
  generatePersonalizedTraining,
  DEEP_SQUAT_TRAINING,
  HURDLE_STEP_TRAINING
} from '../data/professional-training';

describe('Professional Training 数据测试', () => {
  describe('数据结构验证', () => {
    it('DEEP_SQUAT_TRAINING 应该有正确的数据结构', () => {
      expect(Array.isArray(DEEP_SQUAT_TRAINING)).toBe(true);
      expect(DEEP_SQUAT_TRAINING.length).toBeGreaterThan(0);
      
      DEEP_SQUAT_TRAINING.forEach(exercise => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('category');
        expect(exercise).toHaveProperty('targetMuscles');
        expect(exercise).toHaveProperty('targetLimitations');
        expect(exercise).toHaveProperty('description');
        expect(exercise).toHaveProperty('biomechanicalRationale');
        expect(exercise).toHaveProperty('instructions');
        expect(exercise).toHaveProperty('progression');
        expect(exercise).toHaveProperty('precautions');
        expect(exercise).toHaveProperty('dosage');
      });
    });

    it('HURDLE_STEP_TRAINING 应该有正确的数据结构', () => {
      expect(Array.isArray(HURDLE_STEP_TRAINING)).toBe(true);
      expect(HURDLE_STEP_TRAINING.length).toBeGreaterThan(0);
      
      HURDLE_STEP_TRAINING.forEach(exercise => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('category');
        expect(exercise).toHaveProperty('targetMuscles');
        expect(exercise).toHaveProperty('targetLimitations');
        expect(exercise).toHaveProperty('description');
        expect(exercise).toHaveProperty('biomechanicalRationale');
        expect(exercise).toHaveProperty('instructions');
        expect(exercise).toHaveProperty('progression');
        expect(exercise).toHaveProperty('precautions');
        expect(exercise).toHaveProperty('dosage');
      });
    });
  });

  describe('训练分类和目标肌肉群验证', () => {
    it('每个练习应该有明确的训练分类', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      const validCategories = ['mobility', 'stability', 'strength', 'neuromuscular', 'corrective', 'neural', 'integration'];
      
      allExercises.forEach(exercise => {
        expect(validCategories).toContain(exercise.category);
      });
    });

    it('目标肌肉群应该具体和解剖学准确', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(Array.isArray(exercise.targetMuscles)).toBe(true);
        expect(exercise.targetMuscles.length).toBeGreaterThan(0);
        
        exercise.targetMuscles.forEach(muscle => {
          expect(typeof muscle).toBe('string');
          expect(muscle.length).toBeGreaterThan(2);
        });
      });
    });

    it('功能限制描述应该具体和专业', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(Array.isArray(exercise.targetLimitations)).toBe(true);
        expect(exercise.targetLimitations.length).toBeGreaterThan(0);
        
        exercise.targetLimitations.forEach(limitation => {
          expect(typeof limitation).toBe('string');
          expect(limitation.length).toBeGreaterThanOrEqual(3); // 至少有一定的描述性
        });
      });
    });

    it('生物力学原理应该科学和详细', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(typeof exercise.biomechanicalRationale).toBe('string');
        expect(exercise.biomechanicalRationale.length).toBeGreaterThan(10);
        
        // 应该包含一些专业术语
        const rationale = exercise.biomechanicalRationale.toLowerCase();
        const hasProfessionalTerms = 
          rationale.includes('肌') || 
          rationale.includes('关节') || 
          rationale.includes('稳定') ||
          rationale.includes('活动度') ||
          rationale.includes('代偿') ||
          rationale.includes('功能') ||
          rationale.includes('控制') ||
          rationale.includes('协调') ||
          rationale.includes('平衡') ||
          rationale.includes('柔韧') ||
          rationale.includes('力量') ||
          rationale.includes('训练') ||
          rationale.includes('改善') ||
          rationale.includes('提高') ||
          rationale.includes('增强') ||
          rationale.includes('动作') ||
          rationale.includes('姿态') ||
          rationale.includes('位置') ||
          rationale.includes('运动') ||
          rationale.includes('锻炼');
        
        expect(hasProfessionalTerms).toBe(true);
      });
    });
  });

  describe('训练指导和安全性验证', () => {
    it('每个练习应该有明确的执行步骤', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(Array.isArray(exercise.instructions)).toBe(true);
        expect(exercise.instructions.length).toBeGreaterThan(0);
        
        exercise.instructions.forEach(instruction => {
          expect(typeof instruction).toBe('string');
          expect(instruction.length).toBeGreaterThan(3);
        });
      });
    });

    it('每个练习应该有进阶方案', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(Array.isArray(exercise.progression)).toBe(true);
        expect(exercise.progression.length).toBeGreaterThan(0);
        
        exercise.progression.forEach(progression => {
          expect(typeof progression).toBe('string');
          expect(progression.length).toBeGreaterThan(3);
        });
      });
    });

    it('每个练习应该有安全注意事项', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        expect(Array.isArray(exercise.precautions)).toBe(true);
        expect(exercise.precautions.length).toBeGreaterThan(0);
        
        exercise.precautions.forEach(precaution => {
          expect(typeof precaution).toBe('string');
          expect(precaution.length).toBeGreaterThan(3);
        });
      });
    });
  });

  describe('训练时间和频率验证', () => {
    it('应该根据评分确定合理的训练时间框架', () => {
      const lowScoreRecs = generatePersonalizedTraining({ 'deep-squat': 1 });
      const highScoreRecs = generatePersonalizedTraining({ 'deep-squat': 3 });
      
      lowScoreRecs.forEach(rec => {
        expect(typeof rec.expectedTimeframe).toBe('string');
        expect(rec.expectedTimeframe.length).toBeGreaterThan(0);
      });
      
      highScoreRecs.forEach(rec => {
        expect(typeof rec.expectedTimeframe).toBe('string');
        expect(rec.expectedTimeframe.length).toBeGreaterThan(0);
      });
    });

    it('应该根据评分确定合理的重评间隔', () => {
      const recommendations = generatePersonalizedTraining({ 
        'deep-squat': 1,
        'shoulder-mobility': 3 
      });
      
      recommendations.forEach(rec => {
        expect(typeof rec.reassessmentInterval).toBe('string');
        expect(rec.reassessmentInterval.length).toBeGreaterThan(0);
        
        // 应该包含时间单位
        const interval = rec.reassessmentInterval;
        const hasTimeUnit = interval.includes('周') || interval.includes('天') || interval.includes('月');
        expect(hasTimeUnit).toBe(true);
      });
    });

    it('训练频率应该合理和可执行', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      
      allExercises.forEach(exercise => {
        const frequency = exercise.dosage.frequency;
        expect(typeof frequency).toBe('string');
        
        // 应该包含合理的频率描述
        const hasValidFrequency = 
          frequency.includes('每日') || 
          frequency.includes('每周') || 
          frequency.includes('次') ||
          frequency.includes('训练前') ||
          frequency.includes('训练后') ||
          frequency.includes('休息日');
        
        expect(hasValidFrequency).toBe(true);
      });
    });
  });

  describe('边界情况和异常处理', () => {
    it('应该处理无效的评分值', () => {
      const invalidScores = {
        'deep-squat': -1,
        'hurdle-step': 5,
        'shoulder-mobility': NaN
      };

      expect(() => {
        generatePersonalizedTraining(invalidScores);
      }).not.toThrow();
    });

    it('应该处理空字符串作为测试ID', () => {
      const emptyIdScores = {
        '': 2,
        'deep-squat': 1
      };

      expect(() => {
        generatePersonalizedTraining(emptyIdScores);
      }).not.toThrow();
    });

    it('应该处理非数值的评分', () => {
      const nonNumericScores: any = {
        'deep-squat': '1',
        'hurdle-step': null,
        'shoulder-mobility': undefined
      };

      expect(() => {
        generatePersonalizedTraining(nonNumericScores);
      }).not.toThrow();
    });
  });

  describe('数据一致性和完整性', () => {
    it('相同评分应该产生一致的结果', () => {
      const scores = { 'deep-squat': 2, 'hurdle-step': 1 };
      
      const result1 = generatePersonalizedTraining(scores);
      const result2 = generatePersonalizedTraining(scores);
      
      expect(result1.length).toBe(result2.length);
      
      // 检查结果的一致性
      result1.forEach((rec1, index) => {
        const rec2 = result2[index];
        expect(rec1.testId).toBe(rec2.testId);
        expect(rec1.score).toBe(rec2.score);
        expect(rec1.priority).toBe(rec2.priority);
      });
    });

    it('所有训练ID应该唯一', () => {
      const allExercises = [...DEEP_SQUAT_TRAINING, ...HURDLE_STEP_TRAINING];
      const ids = allExercises.map(ex => ex.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('训练数据应该完整覆盖主要的FMS测试', () => {
      const scores = {
        'deep-squat': 1,
        'hurdle-step': 1,
        'inline-lunge': 1,
        'shoulder-mobility': 1,
        'active-straight-leg-raise': 1,
        'trunk-stability-pushup': 1,
        'rotary-stability': 1
      };

      const recommendations = generatePersonalizedTraining(scores);
      
      // 应该为低分项目生成训练建议
      expect(recommendations.length).toBeGreaterThan(0);
      
      // 检查是否包含主要测试项目
      const testIds = recommendations.map(rec => rec.testId);
      expect(testIds).toContain('deep-squat');
      expect(testIds).toContain('hurdle-step');
    });
  });

  describe('个性化训练生成测试', () => {
    it('应该根据评分确定正确的优先级', () => {
      const lowScores = { 'deep-squat': 1, 'hurdle-step': 1 };
      const highScores = { 'deep-squat': 3, 'hurdle-step': 3 };
      
      const lowRecs = generatePersonalizedTraining(lowScores);
      const highRecs = generatePersonalizedTraining(highScores);
      
      // 低分应该产生高优先级训练
      lowRecs.forEach(rec => {
        expect(['critical', 'high']).toContain(rec.priority);
      });
      
      // 高分可能产生较低优先级训练或无训练
      if (highRecs.length > 0) {
        highRecs.forEach(rec => {
          expect(['medium', 'low']).toContain(rec.priority);
        });
      }
    });

    it('应该为每个推荐提供完整的练习集', () => {
      const recommendations = generatePersonalizedTraining({ 
        'deep-squat': 1,
        'hurdle-step': 2
      });
      
      recommendations.forEach(rec => {
        expect(Array.isArray(rec.exercises)).toBe(true);
        expect(rec.exercises.length).toBeGreaterThan(0);
        
        rec.exercises.forEach(exercise => {
          expect(exercise).toHaveProperty('id');
          expect(exercise).toHaveProperty('name');
          expect(exercise).toHaveProperty('category');
          expect(exercise).toHaveProperty('dosage');
        });
      });
    });
  });
}); 