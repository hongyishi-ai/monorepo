import React from 'react';
import { CardContent, CardWithIcon } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Microscope } from 'lucide-react';

interface PathologyAnalysisProps {
  failedClearanceTests: Array<[string, number]>;
  affectedBasicTests: Array<{ id: string; name: string }>;
  pathologyData: any[]; // 临时使用any类型，避免复杂的类型定义
}

/**
 * 病理分析组件
 * 
 * 专门展示疼痛临床意义和排除性测试阳性结果解读，包括：
 * - 病理表现描述
 * - 潜在损伤类型
 * - 生物力学机制
 * - 临床建议
 * - 受影响的基础测试
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理病理分析展示
 * - 纯函数：根据props渲染，无副作用
 * - 条件渲染：只在有阳性结果时显示
 */
export const PathologyAnalysis: React.FC<PathologyAnalysisProps> = ({
  failedClearanceTests,
  affectedBasicTests,
  pathologyData,
}) => {
  // 条件渲染：如果没有失败的排除测试，不渲染组件
  if (failedClearanceTests.length === 0) {
    return null;
  }

  return (
    <CardWithIcon 
      icon={Microscope} 
      iconColor="text-red-600" 
      iconSize="xl" 
      iconPosition="bottom-right" 
      iconOpacity={0.05}
      className="brooklyn-card bg-red-50/30"
    >
      <CardContent className="px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="brooklyn-title text-2xl mb-4 text-red-800">疼痛的临床意义解读</h2>
          <p className="brooklyn-text text-center max-w-2xl mx-auto text-red-700">
            以下排除性测试出现阳性结果，表明存在潜在的病理状态，需要专业医学评估和干预。<br/>
            <span className="font-medium">注意：相关的基础测试已被自动判定为0分</span>
          </p>
          
          {/* 显示受影响的基础测试 */}
          {affectedBasicTests.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">受影响的基础测试：</h4>
              <div className="flex flex-wrap gap-2">
                {affectedBasicTests.map((test: any) => (
                  <Badge key={test.id} variant="secondary" className="bg-amber-100 text-amber-800">
                    {test.name.split(' (')[0]}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-2">
                这些测试因对应的排除测试阳性而被自动判定为0分，以确保安全评估原则。
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {failedClearanceTests.map(([testId]: any) => {
            const pathologyItem = pathologyData.find((p: any) => p.testId === testId);
            if (!pathologyItem) return null;

            return (
              <div key={testId} className="p-8 bg-white border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-red-800">{pathologyItem.testName}</h3>
                
                <div className="space-y-6">
                  {/* 病理描述 */}
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">病理表现</h4>
                    <p className="text-red-800 text-sm">{pathologyItem.pathologyIndicators.description}</p>
                  </div>

                  {/* 潜在损伤 */}
                  <div>
                    <h4 className="font-medium mb-3 text-red-800">潜在损伤类型</h4>
                    <div className="grid gap-2">
                      {pathologyItem.pathologyIndicators.potentialInjuries.map((injury: any, idx: number) => (
                        <div key={idx} className="p-3 bg-red-100 rounded text-sm text-red-800">
                          • {injury}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 生物力学机制 */}
                  <div>
                    <h4 className="font-medium mb-3 text-red-800">生物力学机制</h4>
                    <div className="grid gap-2">
                      {pathologyItem.pathologyIndicators.biomechanicalMechanism.map((mechanism: any, idx: number) => (
                        <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                          • {mechanism}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 临床建议 */}
                  <div>
                    <h4 className="font-medium mb-3 text-green-800">临床建议</h4>
                    <div className="grid gap-2">
                      {pathologyItem.pathologyIndicators.clinicalRecommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </CardWithIcon>
  );
}; 