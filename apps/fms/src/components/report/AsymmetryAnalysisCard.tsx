import { Card, CardContent } from '@/components/ui/card';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { ArrowLeftRight, AlertTriangle, TrendingDown } from 'lucide-react';

interface AsymmetryData {
  riskLevel: 'high' | 'medium' | 'low';
  asymmetryLevel: number;
}

interface BilateralScore {
  left: number;
  right: number;
}

interface RiskAssessment {
  title: string;
  description: string;
  recommendations: string[];
}

interface TestInfo {
  name: string;
  id: string;
}

interface AsymmetryAnalysisCardProps {
  asymmetryIssues: Record<string, AsymmetryData>;
  bilateralScores: Record<string, BilateralScore>;
  testMap: Record<string, TestInfo>;
  getAsymmetryRiskAssessment: (asymmetryLevel: string, testName: string) => RiskAssessment | null;
}

/**
 * 不对称性分析卡片组件
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理不对称性分析展示
 * - 数据驱动：基于分析结果动态渲染
 * - 组合：复用ContainerWithIcon等组件
 * - 条件渲染：只在有不对称问题时显示
 */
export const AsymmetryAnalysisCard = ({
  asymmetryIssues,
  bilateralScores,
  testMap,
  getAsymmetryRiskAssessment
}: AsymmetryAnalysisCardProps) => {
  
  // 检查是否有不对称问题 - 遵循"条件渲染"原则
  const hasAsymmetryIssues = Object.keys(asymmetryIssues).length > 0;
  
  if (!hasAsymmetryIssues) {
    return null;
  }

  // 获取风险等级对应的图标
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return AlertTriangle;
      case 'medium': return TrendingDown;
      default: return TrendingDown;
    }
  };

  // 获取风险等级对应的颜色
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  // 获取风险等级对应的背景样式
  const getRiskBgStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-50/50 border-red-200';
      case 'medium': return 'bg-amber-50/50 border-amber-200';
      default: return 'bg-blue-50/50 border-blue-200';
    }
  };

  // 获取风险等级对应的文字颜色
  const getRiskTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-800';
      case 'medium': return 'text-amber-800';
      default: return 'text-blue-800';
    }
  };

  const getRiskDescriptionColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-amber-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <Card className="brooklyn-card mb-20" style={{ position: 'relative' }}>
      {/* 背景图标 */}
      <ArrowLeftRight 
        className="absolute bottom-4 right-6 w-24 h-24 text-blue-600 opacity-5 z-0"
        aria-hidden="true"
      />
      
      <CardContent className="px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="brooklyn-title text-2xl mb-4">不对称性风险分析</h2>
          <p className="brooklyn-subtitle">
            检测到左右侧功能差异，这是运动损伤风险的重要指标
          </p>
        </div>

        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto px-2 md:px-0">
          {Object.entries(asymmetryIssues).map(([testId, asymmetryData]) => {
            const test = testMap[testId];
            const bilateralData = bilateralScores[testId];
                         const riskAssessment = getAsymmetryRiskAssessment(asymmetryData.asymmetryLevel.toString(), test?.name || '');
            
            // 防护性检查 - 遵循"快速失败"原则
            if (!test || !bilateralData || !riskAssessment) return null;

            const RiskIcon = getRiskIcon(asymmetryData.riskLevel);

            return (
              <ContainerWithIcon
                key={testId}
                icon={RiskIcon}
                iconColor={getRiskColor(asymmetryData.riskLevel)}
                iconSize="lg"
                iconPosition="top-right"
                iconOpacity={0.1}
                as={Card}
                className={`brooklyn-card ${getRiskBgStyle(asymmetryData.riskLevel)}`}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h4 className={`font-medium mb-2 ${getRiskTextColor(asymmetryData.riskLevel)}`}>
                        {test.name} - {riskAssessment.title}
                      </h4>
                      <p className={`brooklyn-text leading-relaxed mb-3 ${getRiskDescriptionColor(asymmetryData.riskLevel)}`}>
                        {riskAssessment.description}
                      </p>
                      
                      {/* 左右侧得分展示 - 移动端优化 */}
                      <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mb-3 md:mb-4 p-3 md:p-4 bg-white/50 rounded-lg">
                        <div>
                          <div className="text-xl md:text-2xl font-light text-blue-600">{bilateralData.left}</div>
                          <div className="brooklyn-text text-xs">左侧</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <ArrowLeftRight className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-xl md:text-2xl font-light text-blue-600">{bilateralData.right}</div>
                          <div className="brooklyn-text text-xs">右侧</div>
                        </div>
                      </div>

                      {/* 风险等级指示器 */}
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <span className="brooklyn-text text-xs">风险等级：</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          asymmetryData.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          asymmetryData.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {asymmetryData.riskLevel === 'high' ? '高风险' :
                           asymmetryData.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>

                      {/* 建议列表 - 移动端优化 */}
                      {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
                        <div className="p-3 bg-white/70 rounded-lg">
                          <h5 className="text-sm font-medium mb-2">专业建议：</h5>
                          <ul className="space-y-1">
                            {riskAssessment.recommendations.map((recommendation, index) => (
                              <li key={index} className="text-xs brooklyn-text flex items-start gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </ContainerWithIcon>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 
