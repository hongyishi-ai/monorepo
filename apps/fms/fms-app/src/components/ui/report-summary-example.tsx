import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReportData } from '@/hooks/useReportData';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface ReportSummaryProps {
  scores: Record<string, number>;
  asymmetryIssues: Record<string, any>;
  painfulTests: string[];
  basicTestIds: string[];
  clearanceTestIds: string[];
}

/**
 * 报告摘要组件 - React哲学实践示例
 * 
 * 遵循的原则：
 * - 单一职责：只负责展示评估摘要
 * - 组合优于继承：组合使用useReportData Hook
 * - 声明式：基于数据状态声明UI外观
 * - 透明数据流：props明确，无隐式依赖
 */
export const ReportSummaryExample = ({
  scores,
  asymmetryIssues,
  painfulTests,
  basicTestIds,
  clearanceTestIds
}: ReportSummaryProps) => {
  
  // 使用自定义Hook处理复杂计算 - 遵循"状态与UI分离"
  const {
    basicScoreData,
    clearanceAnalysis,
    asymmetryAnalysis,
    assessmentStatus,
    hasPain,
    hasAsymmetry
  } = useReportData({
    scores,
    asymmetryIssues,
    painfulTests,
    basicTestIds,
    clearanceTestIds
  });

  // 状态图标映射 - 遵循"声明式"原则
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '功能良好':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case '建议改善':
        return <TrendingUp className="h-5 w-5 text-amber-600" />;
      case '需要关注':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="brooklyn-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="brooklyn-title text-xl">评估摘要</CardTitle>
          {getStatusIcon(assessmentStatus.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 整体状态 - 遵循"条件渲染"原则 */}
        <div className={`p-4 rounded-lg border ${assessmentStatus.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={assessmentStatus.color}>
              {assessmentStatus.status}
            </Badge>
          </div>
          <p className="brooklyn-text text-sm">
            {assessmentStatus.description}
          </p>
        </div>

        {/* 分数概览 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {basicScoreData.totalScore}
            </div>
            <p className="text-sm text-blue-700">总分</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {basicScoreData.percentage}%
            </div>
            <p className="text-sm text-gray-700">完成率</p>
          </div>
        </div>

        {/* 关键问题提示 - 遵循"快速失败"原则 */}
        <div className="space-y-2">
          {hasPain && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">检测到疼痛症状</span>
            </div>
          )}
          
          {clearanceAnalysis.hasFailedClearance && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">排除测试异常</span>
            </div>
          )}
          
          {hasAsymmetry && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-yellow-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                检测到{asymmetryAnalysis.asymmetryCount}项不对称
              </span>
            </div>
          )}
        </div>

        {/* 数据为空时的处理 - 遵循"条件渲染"原则 */}
        {!hasPain && !hasAsymmetry && !clearanceAnalysis.hasFailedClearance && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 text-sm">
              未发现明显功能异常
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 