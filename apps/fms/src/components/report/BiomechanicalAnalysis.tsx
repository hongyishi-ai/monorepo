import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Microscope, ArrowLeftRight } from 'lucide-react';
import { FMS_BIOMECHANICS } from '@/data/fms-biomechanics';

interface BiomechanicalAnalysisProps {
  basicTestsScores: Array<[string, number]>;
  bilateralScores: Record<string, any>;
}

/**
 * 生物力学分析组件 - 布鲁克林极简主义风格重设计
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理生物力学数据展示
 * - 纯函数：根据props渲染，无副作用
 * - 声明式设计：清晰的视觉层次
 * - 极简美学：减少视觉噪音，突出核心内容
 */
export const BiomechanicalAnalysis: React.FC<BiomechanicalAnalysisProps> = ({
  basicTestsScores,
  bilateralScores,
}) => {
  // 展开状态管理
  const [expandedAnalysis, setExpandedAnalysis] = useState<string>('');

  // 处理手风琴展开时的平滑滚动
  const handleAnalysisChange = (value: string) => {
    setExpandedAnalysis(value);
    
    // 给手风琴动画足够的时间完全展开，然后滚动到该分析项
    setTimeout(() => {
      if (value) {
        const analysisElement = document.querySelector(`[data-analysis="${value}"]`);
        if (analysisElement) {
          // 计算导航栏高度和适当的偏移量
          const navHeight = 72; // 导航栏高度约80px
          const extraOffset = 20; // 额外的缓冲空间
          const targetOffset = navHeight + extraOffset;
          
          // 获取元素位置并手动计算滚动位置
          const elementRect = analysisElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetScrollTop = scrollTop + elementRect.top - targetOffset;
          
          // 使用window.scrollTo获得更好的控制
          window.scrollTo({
            top: Math.max(0, targetScrollTop), // 确保不会滚动到负值
            behavior: 'smooth'
          });
        }
      }
    }, 400); // 给手风琴动画足够的时间展开
  };

  return (
    <Card className="brooklyn-card mb-20" style={{ position: 'relative' }}>
      {/* 背景图标 */}
      <Microscope 
        className="absolute bottom-6 right-8 w-32 h-32 text-blue-600 opacity-5 z-0"
        aria-hidden="true"
      />
      
      <CardContent className="px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="brooklyn-title text-2xl mb-4">生物力学与功能分析</h2>
          <p className="brooklyn-subtitle max-w-2xl mx-auto">
            基于功能性动作筛查的深度生物力学解析，为每个测试提供详细的解剖学分析和专业指导
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className="space-y-4 md:space-y-6 max-w-5xl mx-auto px-2 md:px-0"
          value={expandedAnalysis}
          onValueChange={handleAnalysisChange}
        >
          {basicTestsScores.map(([testId, score]) => {
            const biomechanicalData = FMS_BIOMECHANICS.find(b => b.testId === testId);
            if (!biomechanicalData) return null;

            const scoreAnalysis = biomechanicalData.scoreAnalyses.find(a => a.score === score);
            const bilateralData = bilateralScores[testId];
            
            return (
              <AccordionItem 
                key={testId} 
                value={testId} 
                className="brooklyn-card border-0"
                data-analysis={testId}
              >
                <AccordionTrigger className="px-4 md:px-8 py-4 md:py-6 hover:no-underline rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                      <Badge 
                        variant={score === 3 ? "default" : score === 2 ? "secondary" : "outline"}
                        className="px-2 md:px-3 py-1 text-xs md:text-sm flex-shrink-0"
                      >
                        {bilateralData ? `左${bilateralData.left}|右${bilateralData.right}→${bilateralData.final}分` : `${score}分`}
                      </Badge>
                      <h3 className="brooklyn-title text-base md:text-lg text-left truncate">{biomechanicalData.testName}</h3>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 md:px-8 pb-6 md:pb-8">
                  <div className="space-y-6 md:space-y-10">
                    {/* 临床意义 - 极简设计 */}
                    <div className="border-l-4 border-blue-500 pl-4 md:pl-6 py-2">
                      <h4 className="brooklyn-title text-sm mb-3 text-blue-800">临床意义</h4>
                      <p className="brooklyn-text leading-relaxed text-sm md:text-base">
                        {biomechanicalData.clinicalSignificance}
                      </p>
                    </div>

                    {/* 关节运动模式 - 简化表格设计 */}
                    <div>
                      <h4 className="brooklyn-title text-sm mb-4 md:mb-6">关节运动模式</h4>
                      <div className="space-y-2 md:space-y-3">
                        {biomechanicalData.jointMovements.map((movement, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 md:py-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1 min-w-0">
                              <span className="brooklyn-title text-sm">{movement.joint}</span>
                              <p className="brooklyn-text text-xs mt-1 truncate">{movement.movement}</p>
                            </div>
                            <Badge variant="outline" className="brooklyn-text text-xs ml-2 md:ml-4 flex-shrink-0">
                              {movement.range}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 肌肉群分析 - 分组简化显示 */}
                    <div>
                      <h4 className="brooklyn-title text-sm mb-4 md:mb-6">关键肌肉群分析</h4>
                      <div className="space-y-4 md:space-y-6">
                        {['primary', 'synergist', 'stabilizer'].map(category => {
                          const muscles = biomechanicalData.muscleGroups.filter(m => m.category === category);
                          if (muscles.length === 0) return null;
                          
                          const categoryNames = {
                            primary: '主动肌',
                            synergist: '协同肌',
                            stabilizer: '稳定肌'
                          };

                          return (
                            <div key={category}>
                              <h5 className="brooklyn-title text-xs text-gray-600 mb-3">
                                {categoryNames[category as keyof typeof categoryNames]}
                              </h5>
                              <div className="space-y-2 md:space-y-3">
                                {muscles.map((muscle, idx) => (
                                  <div key={idx} className="p-3 md:p-4 bg-gray-50/50 rounded-lg">
                                    <div className="brooklyn-title text-sm mb-2 md:mb-3">{muscle.name}</div>
                                    <div className="brooklyn-text text-xs space-y-1 leading-relaxed">
                                      <div><span className="text-gray-600">起点：</span>{muscle.origin}</div>
                                      <div><span className="text-gray-600">止点：</span>{muscle.insertion}</div>
                                      <div><span className="text-gray-600">功能：</span>{muscle.function}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {scoreAnalysis && (
                      <div className="space-y-6 md:space-y-8">
                        {/* 功能限制与代偿模式 - 统一的极简设计 */}
                        {scoreAnalysis.functionalLimitations.length > 0 && (
                          <div>
                            <h4 className="brooklyn-title text-sm mb-4">功能限制</h4>
                            <div className="space-y-2">
                              {scoreAnalysis.functionalLimitations.slice(0,3).map((limitation, idx) => (
                                <div key={idx} className="brooklyn-text text-sm py-2 border-l-2 border-red-300 pl-3 md:pl-4">
                                  {limitation}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {scoreAnalysis.compensatoryPatterns.length > 0 && (
                          <div>
                            <h4 className="brooklyn-title text-sm mb-4">代偿模式</h4>
                            <div className="space-y-2">
                              {scoreAnalysis.compensatoryPatterns.slice(0,3).map((pattern, idx) => (
                                <div key={idx} className="brooklyn-text text-sm py-2 border-l-2 border-amber-300 pl-3 md:pl-4">
                                  {pattern}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 专业建议 */}
                        <div>
                          <h4 className="brooklyn-title text-sm mb-4">专业建议</h4>
                          <div className="space-y-2">
                            {scoreAnalysis.recommendations.map((rec, idx) => (
                              <div key={idx} className="brooklyn-text text-sm py-2 border-l-2 border-green-300 pl-4">
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 风险因素（仅0分显示） */}
                        {scoreAnalysis.riskFactors && scoreAnalysis.riskFactors.length > 0 && (
                          <div className="mt-6 p-6 bg-red-50/50 rounded-lg border border-red-200">
                            <h4 className="brooklyn-title text-sm mb-4 text-red-800">风险因素</h4>
                            <div className="space-y-2">
                              {scoreAnalysis.riskFactors.map((risk, idx) => (
                                <div key={idx} className="brooklyn-text text-sm text-red-700">
                                  • {risk}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 双侧不对称分析 */}
                    {bilateralData && bilateralData.asymmetryData && (
                      <div className="mt-8 p-6 bg-blue-50/50 rounded-lg border border-blue-200">
                        <h4 className="brooklyn-title text-sm mb-4 text-blue-800 flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4" />
                          不对称性分析
                        </h4>
                        <div className="space-y-3 brooklyn-text text-sm text-blue-700">
                          <div className="flex justify-between">
                            <span>左右差值：</span>
                            <span className="font-medium">{Math.abs(bilateralData.left - bilateralData.right)}分</span>
                          </div>
                          <div className="flex justify-between">
                            <span>风险等级：</span>
                            <span className="font-medium">
                              {bilateralData.asymmetryData?.riskLevel === 'high' ? '高风险' : 
                               bilateralData.asymmetryData?.riskLevel === 'medium' ? '中等风险' : '低风险'}
                            </span>
                          </div>
                          {bilateralData.asymmetryData?.recommendations?.length > 0 && (
                            <div className="pt-2 border-t border-blue-200">
                              <span className="block mb-2">建议措施：</span>
                              <span className="brooklyn-text text-xs">
                                {bilateralData.asymmetryData.recommendations.slice(0, 2).join('、')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}; 
