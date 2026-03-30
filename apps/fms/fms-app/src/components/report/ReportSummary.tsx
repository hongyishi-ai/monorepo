import { Card, CardContent } from '@/components/ui/card';

interface AssessmentStatus {
  status: string;
  color: string;
  bg: string;
  description: string;
}

interface ReportSummaryProps {
  totalScore: number;
  maxScore: number;
  assessmentStatus: AssessmentStatus;
}

/**
 * 报告摘要组件
 * 
 * 遵循React哲学：
 * - 单一职责：专门展示评估总分和状态
 * - 声明式：基于props声明UI状态
 * - 组合：可与其他报告组件组合使用
 * - 透明数据流：所有数据通过props明确传入
 */
export const ReportSummary = ({
  totalScore,
  maxScore,
  assessmentStatus,
}: ReportSummaryProps) => {
  
  return (
    <div className="text-center mb-16 md:mb-20 minimal-fade-in" role="region" aria-label="报告摘要">
      <h1 className="brooklyn-title mb-6">FMS 评估报告</h1>
      <p className="brooklyn-subtitle mb-12 max-w-3xl mx-auto">
        基于您的功能性动作筛查结果生成，
        <br className="hidden sm:inline" />
        为您的运动健康提供科学依据和专业建议。
      </p>
      
      {/* 总分展示卡片 - 遵循"条件渲染"原则 */}
      <Card className={`brooklyn-card ${assessmentStatus.bg} max-w-2xl mx-auto`}>
        <CardContent className="p-8" aria-live="polite" aria-label={`FMS总分 ${totalScore} / ${maxScore}，功能状态：${assessmentStatus.status}`}>
          <div className="text-center space-y-4">
            {/* 分数圆形显示 */}
            <div className={`w-20 h-20 mx-auto rounded-full ${assessmentStatus.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
              <span className={`text-4xl font-light ${assessmentStatus.color}`}>
                {totalScore}
              </span>
            </div>
            
            {/* 分数详情 */}
            <h2 className={`text-xl font-normal ${assessmentStatus.color}`}>
              总分：{totalScore}/{maxScore}分
            </h2>
            
            {/* 功能状态 */}
            <div className={`text-lg font-medium ${assessmentStatus.color}`}>
              功能状态：{assessmentStatus.status}
            </div>
            
            {/* 状态描述 */}
            <p className="brooklyn-text text-sm">
              {assessmentStatus.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 