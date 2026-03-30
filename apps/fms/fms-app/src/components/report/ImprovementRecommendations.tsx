import React from 'react';
import { Link } from 'react-router-dom';
import { CardContent, CardWithIcon } from '@/components/ui/card';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { Button } from '@/components/ui/button';
import { Target, AlertTriangle, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { CLEARANCE_TESTS } from '@/data/fms-tests';

interface ImprovementRecommendationsProps {
  lowScoringTests: Array<{ id: string; name: string; description: string }>;
  asymmetryIssues: Record<string, any>;
  testMap: Record<string, any>;
  searchParams: URLSearchParams;
}

/**
 * 改善建议组件
 * 
 * 专门展示重点改善建议和康复方案，包括：
 * - 低分测试的改善建议
 * - 不对称性问题的纠正建议
 * - 康复方案导航按钮
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理改善建议展示
 * - 纯函数：根据props渲染，无副作用
 * - 条件渲染：只在有改善需求时显示
 */
export const ImprovementRecommendations: React.FC<ImprovementRecommendationsProps> = ({
  lowScoringTests,
  asymmetryIssues,
  testMap,
  searchParams,
}) => {
  // 过滤排除测试的对称1分情况 - 修复核心逻辑错误
  const filteredAsymmetryIssues = React.useMemo(() => {
    const clearanceTestIds = CLEARANCE_TESTS.map(test => test.id);
    
    return Object.fromEntries(
      Object.entries(asymmetryIssues).filter(([testId, asymmetryData]) => {
        // 如果是排除测试且双侧都是1分（正常），则不应该显示改善建议
        if (clearanceTestIds.includes(testId)) {
          const { leftScore, rightScore } = asymmetryData;
          // 排除测试：1分表示正常，对称的1分不需要改善
          if (leftScore === 1 && rightScore === 1) {
            return false;
          }
        }
        return true;
      })
    );
  }, [asymmetryIssues]);

  // 计算是否存在有效的不对称问题（基于过滤后的数据）
  const hasValidAsymmetry = Object.keys(filteredAsymmetryIssues).length > 0;

  // 条件渲染：如果没有需要改善的项目，不渲染组件
  if (lowScoringTests.length === 0 && !hasValidAsymmetry) {
    return null;
  }

  return (
    <div className="mt-16 md:mt-20">
      <CardWithIcon 
        icon={Target} 
        iconColor="text-primary" 
        iconSize="xl" 
        iconPosition="bottom-right" 
        iconOpacity={0.05}
        className="brooklyn-card mb-12"
      >
        <CardContent className="px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="brooklyn-title text-2xl mb-4">重点改善建议</h3>
            <p className="brooklyn-subtitle">
              
            </p>
          </div>
          
          <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto px-2 md:px-0">
            {/* 低分测试建议 */}
            {lowScoringTests.map((test: any) => (
              <ContainerWithIcon
                key={test.id}
                icon={AlertTriangle}
                iconColor="text-amber-600"
                iconSize="md"
                iconPosition="top-right"
                iconOpacity={0.1}
                className="p-4 md:p-6 bg-background brooklyn-card"
              >
                <div className="space-y-2 md:space-y-3">
                  <h4 className="font-medium text-sm md:text-base">{test.name} - 动作质量需改善</h4>
                  <p className="brooklyn-text text-sm leading-relaxed">
                    {test.description}
                  </p>
                  <p className="text-xs brooklyn-text">
                    <strong>改善建议：</strong>
                    针对该动作模式进行专项的灵活性、稳定性和动作控制训练。
                  </p>
                </div>
              </ContainerWithIcon>
            ))}

            {/* 不对称性建议 - 使用过滤后的数据 */}
            {Object.entries(filteredAsymmetryIssues)
              .filter(([testId]: any) => !lowScoringTests.some((test: any) => test.id === testId))
              .map(([testId, asymmetryData]: any) => {
                const test = testMap[testId];
                if (!test) return null;

                return (
                  <ContainerWithIcon
                    key={testId}
                    icon={ArrowLeftRight}
                    iconColor="text-blue-600"
                    iconSize="md"
                    iconPosition="top-right"
                    iconOpacity={0.1}
                    className="p-4 md:p-6 bg-background brooklyn-card"
                  >
                    <div className="space-y-2 md:space-y-3">
                      <h4 className="font-medium text-sm md:text-base">{test.name} - 不对称性需关注</h4>
                      <p className="brooklyn-text text-sm leading-relaxed">
                        检测到{asymmetryData.asymmetryLevel === 'severe' ? '严重' : 
                                asymmetryData.asymmetryLevel === 'moderate' ? '中等' : '轻微'}的左右侧功能差异。
                      </p>
                      <p className="text-xs brooklyn-text">
                        <strong>纠正建议：</strong>
                        重点加强弱侧训练，避免过度依赖优势侧，建立对称的动作模式。
                      </p>
                    </div>
                  </ContainerWithIcon>
                );
              })}
          </div>
        </CardContent>
      </CardWithIcon>
      
      {/* 康复方案按钮 - 移到卡片外部 */}
      <div className="text-center mb-16 md:mb-20">
        <Link to={`/training${searchParams.get('recordId') ? `?recordId=${searchParams.get('recordId')}` : ''}`}>
          <Button className="brooklyn-button px-8">
            <TrendingUp className="w-4 h-4 mr-2" />
            查看专业康复方案
          </Button>
        </Link>
      </div>
    </div>
  );
}; 