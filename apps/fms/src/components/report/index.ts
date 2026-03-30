// Report组件模块统一导出
// 遵循React哲学：模块化和组合原则

export { ReportSummary } from './ReportSummary';
export { RiskAlerts } from './RiskAlerts';
export { ScoreRadarChart } from './ScoreRadarChart';
export { AsymmetryAnalysisCard } from './AsymmetryAnalysisCard';
export { ClearanceTestResults } from './ClearanceTestResults';

// 阶段三新增组件
export { DetailedScoreResults } from './DetailedScoreResults';
export { BiomechanicalAnalysis } from './BiomechanicalAnalysis';
export { PathologyAnalysis } from './PathologyAnalysis';
export { ImprovementRecommendations } from './ImprovementRecommendations';

// 导出类型定义
export type { 
  // 从ReportSummary导出的类型
} from './ReportSummary';

export type {
  // 从其他组件导出的类型根据需要添加
} from './RiskAlerts'; 