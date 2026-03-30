import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { AlertTriangle, ArrowLeftRight, Shield } from 'lucide-react';

interface RiskAlertsProps {
  painfulTests: string[];
  testNameMap: Record<string, string>;
  highRiskAsymmetry: number;
  failedClearanceTests: Array<[string, number]>;
}

/**
 * 风险警告组件
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理风险警告展示
 * - 条件渲染：只在有风险时显示对应警告
 * - 组合：使用ContainerWithIcon等子组件
 * - 快速失败：明确显示严重问题
 */
export const RiskAlerts = ({
  painfulTests,
  testNameMap,
  highRiskAsymmetry,
  failedClearanceTests
}: RiskAlertsProps) => {
  
  // 检查是否有任何风险需要显示 - 遵循"条件渲染"原则
  const hasPain = painfulTests.length > 0;
  const hasHighRiskAsymmetry = highRiskAsymmetry > 0;
  const hasFailedClearance = failedClearanceTests.length > 0;
  
  // 如果没有任何风险，不渲染组件 - 遵循"条件渲染"原则
  if (!hasPain && !hasHighRiskAsymmetry && !hasFailedClearance) {
    return null;
  }

  return (
    <div className="space-y-6 mb-16 md:mb-20" role="region" aria-label="风险警告" aria-live="polite">
      {/* 疼痛警告 - 最高优先级 */}
      {hasPain && (
        <ContainerWithIcon
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconSize="xl"
          iconPosition="top-right"
          iconOpacity={0.12}
          as={Card}
          className="brooklyn-card bg-red-50/50 border-red-200"
        >
          <CardContent className="px-4 md:px-6 py-6 md:py-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-800">疼痛预警</h3>
              <p className="brooklyn-text text-red-700 leading-relaxed">
                在以下测试中检测到疼痛反应，这可能表示存在潜在的运动系统功能障碍或组织损伤风险。
              </p>
              
              {/* 疼痛测试标签 */}
              <div className="flex flex-wrap gap-2">
                {painfulTests.map(testId => (
                  <Badge key={testId} variant="destructive" className="text-xs">
                    {testNameMap[testId]}
                  </Badge>
                ))}
              </div>
              
              {/* 专业建议 */}
              <div className="p-4 bg-red-100 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  专业建议：立即咨询物理治疗师或运动医学专家，在获得专业许可前避免相关动作训练。
                </p>
              </div>
            </div>
          </CardContent>
        </ContainerWithIcon>
      )}

      {/* 严重不对称风险警告 */}
      {hasHighRiskAsymmetry && (
        <ContainerWithIcon
          icon={ArrowLeftRight}
          iconColor="text-red-600"
          iconSize="xl"
          iconPosition="top-right"
          iconOpacity={0.12}
          as={Card}
          className="brooklyn-card bg-red-50/50 border-red-200"
        >
          <CardContent className="px-4 md:px-6 py-6 md:py-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-800">严重不对称风险</h3>
              <p className="brooklyn-text text-red-700 leading-relaxed">
                检测到 {highRiskAsymmetry} 项严重的左右侧功能不对称，这是运动损伤的高风险因素。
              </p>
              
              {/* 优先级建议 */}
              <div className="p-4 bg-red-100 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  优先级建议：立即停止高强度训练，寻求专业物理治疗师评估，优先进行针对性纠正训练。
                </p>
              </div>
            </div>
          </CardContent>
        </ContainerWithIcon>
      )}

      {/* 排除测试失败警告 */}
      {hasFailedClearance && (
        <ContainerWithIcon
          icon={Shield}
          iconColor="text-amber-600"
          iconSize="xl"
          iconPosition="top-right"
          iconOpacity={0.12}
          as={Card}
          className="brooklyn-card bg-amber-50/50 border-amber-200"
        >
          <CardContent className="px-4 md:px-6 py-6 md:py-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-amber-800">排除测试异常</h3>
              <p className="brooklyn-text text-amber-700 leading-relaxed">
                以下排除测试未能通过，建议在进行相应基础动作评估前优先解决这些问题。
              </p>
              
              {/* 失败测试标签 */}
              <div className="flex flex-wrap gap-2">
                {failedClearanceTests.map(([testId]) => (
                  <Badge 
                    key={testId} 
                    variant="outline" 
                    className="text-xs border-amber-300 text-amber-700"
                  >
                    {testNameMap[testId]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </ContainerWithIcon>
      )}
    </div>
  );
}; 