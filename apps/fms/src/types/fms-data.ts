// FMS系统统一数据类型定义
export interface FMSScore {
  testId: string;
  score: number;
  timestamp: Date;
  notes?: string;
}

export interface BilateralScore {
  left: number;
  right: number;
  final: number;
  asymmetryData: AsymmetryData;
}

export interface AsymmetryData {
  hasAsymmetry: boolean;
  asymmetryLevel: 'none' | 'mild' | 'moderate' | 'severe';
  riskLevel: 'low' | 'medium' | 'high';
  scoreDifference: number;
  recommendations?: string[];
  title?: string;
  description?: string;
  priority?: string;
}

export interface ClearanceTestResult {
  testId: string;
  isPositive: boolean; // true表示阳性（有疼痛）
  affectedBaseTest?: string;
}

// 统一的FMS评估结果数据结构
export interface FMSAssessmentData {
  // 基础信息
  sessionId: string;
  timestamp: Date;
  
  // 分数数据
  basicScores: Record<string, number>;
  bilateralScores: Record<string, BilateralScore>;
  clearanceResults: ClearanceTestResult[];
  
  // 分析结果
  totalScore: number;
  asymmetryIssues: Record<string, AsymmetryData>;
  painfulTests: string[];
  riskFlags: string[];
  
  // 元数据
  completedTests: string[];
  incompleteTests: string[];
  testSequence: string[];
}

// 训练方案数据结构
export interface TrainingPlanData {
  assessmentData: FMSAssessmentData;
  generatedPlan: ComprehensiveTrainingPlan;
  generationTimestamp: Date;
  version: string;
}

// 导出类型（从现有文件导入）
export interface Exercise {
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

export interface CorrectionPlan {
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

export interface TrainingPhase {
  phase: number;
  title: string;
  description: string;
  prerequisite?: string;
  correctionPlans: CorrectionPlan[];
  estimatedWeeks: number;
}

export interface ComprehensiveTrainingPlan {
  phases: TrainingPhase[];
  totalSteps: number;
  estimatedWeeks: number;
  hasPainIssues: boolean;
}

export interface Contraindication {
  redLight: string[];
  yellowLight: string[];
  greenLight: string[];
} 