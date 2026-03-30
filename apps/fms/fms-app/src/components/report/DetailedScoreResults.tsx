import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetailedScoreResultsProps {
  basicTestsScores: Array<[string, number]>;
  clearanceTestsScores: Array<[string, number]>;
  basicTotalScore: number;
  maxBasicScore: number;
  bilateralScores: Record<string, any>;
  asymmetryIssues: Record<string, any>;
  testNameMap: Record<string, string>;
}

/**
 * 详细评分结果组件
 * 
 * 专门展示FMS评估的详细评分结果，包括：
 * - 基础动作测试的详细评分展示
 * - 排除测试的通过状态
 * - 双侧得分详情和不对称标识
 * 
 * 遵循React哲学：
 * - 单一职责：专门处理评分结果展示
 * - 纯函数：根据props渲染，无副作用
 * - 声明式：清晰的条件渲染逻辑
 */
export const DetailedScoreResults: React.FC<DetailedScoreResultsProps> = ({
  basicTestsScores,
  clearanceTestsScores,
  basicTotalScore,
  maxBasicScore,
  bilateralScores,
  asymmetryIssues,
  testNameMap,
}) => {
  return (
    <Card className="brooklyn-card mb-12 md:mb-20">
      <CardContent className="px-4 md:px-6 py-8 md:py-12">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="brooklyn-title text-2xl mb-4">详细评分结果</h2>
          <p className="brooklyn-text text-sm">功能性动作模式评估与病理性问题筛查</p>
        </div>
        
        <div className="space-y-6 px-2 md:px-0">
          {/* 基础动作测试部分 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <h4 className="font-medium">基础动作测试 ({basicTotalScore}/{maxBasicScore}分)</h4>
            </div>
            <div className="grid gap-3 md:gap-4">
              {basicTestsScores.map(([testId, score]) => {
                const bilateralData = bilateralScores[testId];
                const hasAsymmetryForTest = asymmetryIssues[testId];

                return (
                  <div key={testId} className="p-3 md:p-4 brooklyn-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 flex items-center gap-2">
                          <span className="truncate">{testNameMap[testId]?.split(' (')[0]}</span>
                          {hasAsymmetryForTest && (
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 flex-shrink-0">
                              不对称
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs brooklyn-text">
                          {score === 3 ? '动作质量优秀' : 
                           score === 2 ? '动作质量良好' : 
                           score === 1 ? '动作存在限制' : '检测到疼痛'}
                        </div>
                      </div>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        score === 0 ? 'bg-red-500 text-white' :
                        score === 1 ? 'bg-amber-500 text-white' :
                        score === 2 ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {score}
                      </div>
                    </div>

                    {/* 双侧得分详情 - 移动端优化 */}
                    {bilateralData && (
                      <div className="mt-3 pt-3 border-t border-muted/30">
                        <div className="grid grid-cols-3 gap-1 md:gap-2 text-center text-xs">
                          <div>
                            <div className="text-blue-600 font-medium">{bilateralData.left}</div>
                            <div className="brooklyn-text">左侧</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">→</div>
                            <div className="brooklyn-text">取低分</div>
                          </div>
                          <div>
                            <div className="text-green-600 font-medium">{bilateralData.right}</div>
                            <div className="brooklyn-text">右侧</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 排除测试部分 */}
          <div className="pt-6 border-t border-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <h4 className="font-medium">排除测试 ({clearanceTestsScores.filter(([, score]) => score === 1).length}/{clearanceTestsScores.length}项通过)</h4>
            </div>
            <div className="grid gap-3 md:gap-4">
              {clearanceTestsScores.map(([testId, score]) => (
                <div key={testId} className="flex items-center justify-between p-3 md:p-4 brooklyn-card">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1 truncate">
                      {testNameMap[testId]?.split(' (')[0]}
                    </div>
                    <div className="text-xs brooklyn-text">
                      {score === 0 ? '检测到异常，需要关注' : '测试正常，可以继续'}
                    </div>
                  </div>
                  <Badge variant={score === 0 ? 'destructive' : 'default'} className="text-xs flex-shrink-0">
                    {score === 0 ? '未通过' : '通过'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 