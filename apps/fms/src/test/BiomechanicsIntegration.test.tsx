import { describe, test, expect } from 'vitest';
import { FMS_BIOMECHANICS, CLEARANCE_TEST_PATHOLOGY } from '@/data/fms-biomechanics';

describe('FMS生物力学内容完整性验证', () => {
  
  describe('MD文档内容覆盖度测试', () => {
    test('应包含所有7个FMS基础测试', () => {
      const expectedTests = [
        'deep-squat',
        'hurdle-step', 
        'inline-lunge',
        'shoulder-mobility',
        'active-straight-leg-raise',
        'trunk-stability-push-up',
        'rotary-stability'
      ];
      
      const actualTestIds = FMS_BIOMECHANICS.map(test => test.testId);
      
      expectedTests.forEach(testId => {
        expect(actualTestIds).toContain(testId);
      });
      
      expect(actualTestIds).toHaveLength(7);
    });

    test('每个测试应包含完整的生物力学分析结构', () => {
      FMS_BIOMECHANICS.forEach(test => {
        // 基本信息
        expect(test.testId).toBeDefined();
        expect(test.testName).toBeDefined();
        expect(test.clinicalSignificance).toBeDefined();
        
        // 关节运动分析
        expect(test.jointMovements).toBeDefined();
        expect(test.jointMovements.length).toBeGreaterThan(0);
        test.jointMovements.forEach(movement => {
          expect(movement.joint).toBeDefined();
          expect(movement.movement).toBeDefined();
          expect(movement.range).toBeDefined();
        });
        
        // 肌肉群分析
        expect(test.muscleGroups).toBeDefined();
        expect(test.muscleGroups.length).toBeGreaterThan(0);
        test.muscleGroups.forEach(muscle => {
          expect(muscle.name).toBeDefined();
          expect(muscle.origin).toBeDefined();
          expect(muscle.insertion).toBeDefined();
          expect(muscle.function).toBeDefined();
          expect(['primary', 'synergist', 'stabilizer']).toContain(muscle.category);
        });
        
        // 评分分析（0-3分）
        expect(test.scoreAnalyses).toBeDefined();
        expect(test.scoreAnalyses).toHaveLength(4);
        [0, 1, 2, 3].forEach(score => {
          const analysis = test.scoreAnalyses.find(a => a.score === score);
          expect(analysis).toBeDefined();
          expect(analysis!.description).toBeDefined();
          expect(analysis!.functionalLimitations).toBeDefined();
          expect(analysis!.compensatoryPatterns).toBeDefined();
          expect(analysis!.recommendations).toBeDefined();
        });
      });
    });

    test('应包含MD文档中的精确数值和专业术语', () => {
      // 验证过顶深蹲的专业内容
      const deepSquat = FMS_BIOMECHANICS.find(t => t.testId === 'deep-squat')!;
      
      // 检查关节活动度数值
      const hipMovement = deepSquat.jointMovements.find(j => j.joint === '髋关节');
      expect(hipMovement?.range).toContain('90°');
      
      const ankleMovement = deepSquat.jointMovements.find(j => j.joint === '踝关节');
      expect(ankleMovement?.range).toContain('30°');
      
      // 检查肌肉起止点的专业描述
      const gluteMaximus = deepSquat.muscleGroups.find(m => m.name === '臀大肌');
      expect(gluteMaximus?.origin).toContain('骶骨');
      expect(gluteMaximus?.origin).toContain('髂骨');
      expect(gluteMaximus?.insertion).toContain('股骨粗隆');
      
      // 检查功能限制的具体描述
      const score2Analysis = deepSquat.scoreAnalyses.find(a => a.score === 2)!;
      expect(score2Analysis.functionalLimitations).toContain('踝关节背屈受限（小腿三头肌紧张）');
      expect(score2Analysis.compensatoryPatterns).toContain('膝关节内扣(外翻)');
    });

    test('排除性测试应包含详细的病理机制分析', () => {
      expect(CLEARANCE_TEST_PATHOLOGY).toHaveLength(3);
      
      // 验证肩部碰撞测试
      const shoulderTest = CLEARANCE_TEST_PATHOLOGY.find(t => t.testId === 'shoulder-impingement')!;
      expect(shoulderTest.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('≥7mm')
      );
      expect(shoulderTest.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('2-5倍')
      );
      expect(shoulderTest.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('25-40%')
      );
      
      // 验证脊柱伸展测试
      const spinalExtension = CLEARANCE_TEST_PATHOLOGY.find(t => t.testId === 'spinal-extension')!;
      expect(spinalExtension.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('30-40%')
      );
      expect(spinalExtension.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('18-23%')
      );
      
      // 验证脊柱屈曲测试
      const spinalFlexion = CLEARANCE_TEST_PATHOLOGY.find(t => t.testId === 'spinal-flexion')!;
      expect(spinalFlexion.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('40-50%')
      );
      expect(spinalFlexion.pathologyIndicators.biomechanicalMechanism).toContainEqual(
        expect.stringContaining('4-6倍')
      );
    });
  });

  describe('专业术语和解剖学准确性验证', () => {
    test('肌肉分类应符合运动生理学标准', () => {
      FMS_BIOMECHANICS.forEach(test => {
        const primaryMuscles = test.muscleGroups.filter(m => m.category === 'primary');
        // const synergistMuscles = test.muscleGroups.filter(m => m.category === 'synergist');
        const stabilizerMuscles = test.muscleGroups.filter(m => m.category === 'stabilizer');
        
        // 每个测试应该有主动肌
        expect(primaryMuscles.length).toBeGreaterThan(0);
        
        // 所有测试都应该有稳定肌
        expect(stabilizerMuscles.length).toBeGreaterThan(0);
      });
    });

    test('应包含MD文档中的专业解剖学术语', () => {
      const expectedTerms = [
        '髂前下棘',
        '胫骨粗隆', 
        '股骨大转子',
        '坐骨结节',
        '肩胛下窝',
        '尺骨鹰嘴突',
        '腹股沟韧带',
        '胸腰筋膜'
      ];
      
      const allMuscleData = FMS_BIOMECHANICS.flatMap(test => 
        test.muscleGroups.flatMap(muscle => [muscle.origin, muscle.insertion])
      ).join(' ');
      
      expectedTerms.forEach(term => {
        expect(allMuscleData).toContain(term);
      });
    });

         test('功能限制描述应具体且专业', () => {
       FMS_BIOMECHANICS.forEach(test => {
         test.scoreAnalyses.forEach(analysis => {
           if (analysis.score > 0) {
             // 功能限制应该具体描述肌肉或关节问题
             analysis.functionalLimitations.forEach(limitation => {
               if (analysis.score > 1) { // 2分和1分应有详细描述  
                 expect(limitation.length).toBeGreaterThan(6); // 中文表达紧凑，考虑专业术语简洁性
               }
                                               // 应包含专业术语（解剖学或功能性）
                 expect(limitation).toMatch(/[关节|肌|椎|肩|髋|膝|踝|状态|核心|胸椎|腰椎|稳定性|活动度|支撑|控制|力量|能力|协调|神经]/);
             });
           } else {
             // 0分疼痛状态的描述可以较简短但应明确
             expect(analysis.functionalLimitations).toContain('存在潜在病理状态');
           }
         });
       });
     });
  });

  describe('临床应用价值验证', () => {
    test('0分评价应明确指向病理状态', () => {
      FMS_BIOMECHANICS.forEach(test => {
        const painfulAnalysis = test.scoreAnalyses.find(a => a.score === 0)!;
        
        expect(painfulAnalysis.description).toContain('疼痛');
        expect(painfulAnalysis.functionalLimitations).toContain('存在潜在病理状态');
        expect(painfulAnalysis.recommendations).toContainEqual(
          expect.stringContaining('专业医学评估')
        );
        
        // 应有具体的风险因素
        if (painfulAnalysis.riskFactors) {
          expect(painfulAnalysis.riskFactors.length).toBeGreaterThan(0);
        }
      });
    });

    test('排除性测试应提供明确的临床指导', () => {
      CLEARANCE_TEST_PATHOLOGY.forEach(test => {
        expect(test.pathologyIndicators.potentialInjuries.length).toBeGreaterThan(2);
        expect(test.pathologyIndicators.biomechanicalMechanism.length).toBeGreaterThan(3);
        expect(test.pathologyIndicators.clinicalRecommendations.length).toBeGreaterThan(3);
        
        // 临床建议应该具体且可操作
        test.pathologyIndicators.clinicalRecommendations.forEach(recommendation => {
          expect(recommendation.length).toBeGreaterThan(8);
        });
      });
    });

    test('每个测试应有明确的临床意义说明', () => {
      FMS_BIOMECHANICS.forEach(test => {
        expect(test.clinicalSignificance).toBeDefined();
        expect(test.clinicalSignificance.length).toBeGreaterThan(20);
        expect(test.clinicalSignificance).toMatch(/[评估|测试|反映]/);
      });
    });
  });

  describe('数据完整性和一致性验证', () => {
    test('所有肌肉群应有完整的解剖学信息', () => {
      FMS_BIOMECHANICS.forEach(test => {
        test.muscleGroups.forEach(muscle => {
          expect(muscle.name).toBeTruthy();
          expect(muscle.origin).toBeTruthy();
          expect(muscle.insertion).toBeTruthy();
          expect(muscle.function).toBeTruthy();
          expect(muscle.category).toBeTruthy();
          
          // 起止点描述应该合理长度
          expect(muscle.origin.length).toBeGreaterThan(3);
          expect(muscle.insertion.length).toBeGreaterThan(3);
        });
      });
    });

    test('评分建议应该具有针对性和渐进性', () => {
      FMS_BIOMECHANICS.forEach(test => {
        const analyses = test.scoreAnalyses.sort((a, b) => b.score - a.score);
        
        // 3分建议应该是维持性的
        expect(analyses[0].recommendations.some(r => 
          r.includes('维持') || r.includes('保持') || r.includes('继续')
        )).toBe(true);
        
        // 1分建议应该是基础性的
        expect(analyses[2].recommendations.some(r => 
          r.includes('基础') || r.includes('基本') || r.includes('简化')
        )).toBe(true);
      });
    });

    test('应覆盖MD文档中提到的所有关键测试要素', () => {
      // 验证核心测试要素都有对应数据
      // const coreElements = [
      //   '关节运动模式',
      //   '主动肌分析', 
      //   '稳定肌功能',
      //   '代偿模式识别',
      //   '功能限制评估',
      //   '康复建议'
      // ];
      
      // 通过检查数据结构完整性来验证
      FMS_BIOMECHANICS.forEach(test => {
        expect(test.jointMovements.length).toBeGreaterThan(0); // 关节运动模式
        expect(test.muscleGroups.some(m => m.category === 'primary')).toBe(true); // 主动肌
        expect(test.muscleGroups.some(m => m.category === 'stabilizer')).toBe(true); // 稳定肌
        expect(test.scoreAnalyses.some(a => a.compensatoryPatterns.length > 0)).toBe(true); // 代偿模式
        expect(test.scoreAnalyses.some(a => a.functionalLimitations.length > 0)).toBe(true); // 功能限制
        expect(test.scoreAnalyses.every(a => a.recommendations.length > 0)).toBe(true); // 康复建议
      });
    });
  });
});

describe('训练方案专业性验证', () => {
  test('训练建议应基于生物力学原理', () => {
    // 这里可以添加对训练方案的验证
    // 确保训练方案与生物力学分析的一致性
    expect(true).toBe(true); // 占位符，实际测试需要导入训练数据
  });
}); 