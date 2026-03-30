// FMS系统化纠正性训练数据类型定义
// 基于《FMS编码：系统化纠正性训练与康复方案指南》

// ===========================================
// 类型定义 - 用于类型检查和开发
// ===========================================

export interface TrainingExercise {
  id: string;
  name: string;
  description: string;
  type: 'SMR' | '活动度' | '稳定性/运动控制' | '模式整合';
  targetArea: string;
  fmsTestIds: string[];
  videoPlaceholder: string;
  instructions: string[];
  parameters: string; // 如：每侧3次，每次保持20-30秒
  precautions: string[]; // 注意事项
  progression?: string; // 进阶方式
  regression?: string; // 退阶方式
  bilateralSupport: boolean; // 是否支持单侧训练
}

// 训练禁忌与调整矩阵（表格3.1："红黄绿灯"系统）
export interface TrainingGuidance {
  dysfunction: string;
  redLight: string[]; // 避免的训练
  yellowLight: string[]; // 谨慎使用/调整的训练
  greenLight: string[]; // 安全的训练
}

// FMS练习数据接口（与JSON文件结构对应）
export interface FMSExercise {
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

export interface Contraindication {
  redLight: string[];
  yellowLight: string[];
  greenLight: string[];
}

export interface FMSExercisesData {
  fmsCorrectiveExercises: Record<string, FMSExercise[]>;
  trainingContraindications: Record<string, Contraindication>;
  correctionPriority: Record<string, number>;
}

// ===========================================
// 数据源说明
// ===========================================
// 所有实际的训练数据都存储在 complete-fms-exercises.json 中
// 这样可以避免重复，并提供统一的数据源
// 
// 使用方式：
// import fmsExercisesData from '@/data/complete-fms-exercises.json';
// const data = fmsExercisesData as unknown as FMSExercisesData;
// =========================================== 