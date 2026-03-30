import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ClearanceTestResult {
  testId: string;
  testName: string;
  score: number;
  isPassed: boolean;
  isCompleted: boolean;
  clinicalSignificance?: string;
}

interface ClearanceTestResultsProps {
  clearanceResults: ClearanceTestResult[];
  getClinicalSignificance: (testId: string) => string;
}

/**
 * 排除测试结果组件
 * 
 * 遵循React哲学：
 * - 单一职责：专门展示排除测试结果
 * - 纯函数：基于测试结果数据渲染UI
 * - 条件渲染：根据测试状态显示不同内容
 * - 组合：使用Accordion等UI组件
 */
export const ClearanceTestResults = ({
  clearanceResults,
  getClinicalSignificance
}: ClearanceTestResultsProps) => {
  
  // 检查是否有排除测试数据 - 遵循"条件渲染"原则
  if (!clearanceResults || clearanceResults.length === 0) {
    return (
      <ContainerWithIcon
        icon={Shield}
        iconColor="text-gray-400"
        iconSize="xl"
        iconPosition="center"
        iconOpacity={0.1}
        as={Card}
        className="brooklyn-card bg-gray-50/50"
      >
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-4">暂无排除测试数据</h3>
          <p className="brooklyn-text">
            排除测试用于筛查可能影响基础动作评估的疼痛或功能限制
          </p>
        </CardContent>
      </ContainerWithIcon>
    );
  }

  // 分类测试结果 - 遵循"数据处理就近原则"
  const passedTests = clearanceResults.filter(test => test.isPassed && test.isCompleted);
  const failedTests = clearanceResults.filter(test => !test.isPassed && test.isCompleted);
  const incompleteTests = clearanceResults.filter(test => !test.isCompleted);

  // 获取测试状态图标
  const getStatusIcon = (test: ClearanceTestResult) => {
    if (!test.isCompleted) return AlertCircle;
    return test.isPassed ? CheckCircle : XCircle;
  };

  // 获取测试状态颜色
  const getStatusColor = (test: ClearanceTestResult) => {
    if (!test.isCompleted) return 'text-amber-600';
    return test.isPassed ? 'text-green-600' : 'text-red-600';
  };

  // 获取测试状态背景
  const getStatusBg = (test: ClearanceTestResult) => {
    if (!test.isCompleted) return 'bg-amber-50/50 border-amber-200';
    return test.isPassed ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200';
  };

  // 获取测试状态文字
  const getStatusText = (test: ClearanceTestResult) => {
    if (!test.isCompleted) return '未完成';
    return test.isPassed ? '通过' : '未通过';
  };

  return (
    <Card className="brooklyn-card mb-20">
      <CardContent className="p-12">
        <div className="text-center mb-12">
          <h2 className="brooklyn-title text-2xl mb-4">排除测试结果</h2>
          <p className="brooklyn-subtitle">
            排除测试用于识别可能影响基础动作评估的疼痛或功能限制
          </p>
        </div>

        {/* 整体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-light text-blue-600 mb-1">{clearanceResults.length}</div>
            <div className="text-sm brooklyn-text">总测试数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-light text-green-600 mb-1">{passedTests.length}</div>
            <div className="text-sm brooklyn-text">通过测试</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-light text-red-600 mb-1">{failedTests.length}</div>
            <div className="text-sm brooklyn-text">未通过</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-2xl font-light text-amber-600 mb-1">{incompleteTests.length}</div>
            <div className="text-sm brooklyn-text">未完成</div>
          </div>
        </div>

        {/* 排除测试详细结果 */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {clearanceResults.map((test, index) => {
            const StatusIcon = getStatusIcon(test);
            const clinicalSignificance = getClinicalSignificance(test.testId);
            
            return (
              <AccordionItem 
                key={test.testId} 
                value={`clearance-${index}`}
                className="border-none"
              >
                <ContainerWithIcon
                  icon={StatusIcon}
                  iconColor={getStatusColor(test)}
                  iconSize="lg"
                  iconPosition="top-right"
                  iconOpacity={0.1}
                  as={Card}
                  className={`brooklyn-card ${getStatusBg(test)}`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <h4 className="font-medium">{test.testName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={test.isPassed ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {getStatusText(test)}
                            </Badge>
                            {test.isCompleted && (
                              <span className="text-xs brooklyn-text">
                                得分: {test.score}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {/* 测试详情 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="brooklyn-text">测试状态：</span>
                          <span className={`font-medium ${
                            test.isPassed ? 'text-green-600' : 
                            !test.isCompleted ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {getStatusText(test)}
                          </span>
                        </div>
                        <div>
                          <span className="brooklyn-text">测试得分：</span>
                          <span className="font-medium">
                            {test.isCompleted ? test.score : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* 临床意义 */}
                      {clinicalSignificance && (
                        <div className="p-4 bg-white/70 rounded-lg">
                          <h5 className="text-sm font-medium mb-2">临床意义解读：</h5>
                          <p className="text-sm brooklyn-text leading-relaxed">
                            {clinicalSignificance}
                          </p>
                        </div>
                      )}

                      {/* 未通过测试的特殊提示 */}
                      {!test.isPassed && test.isCompleted && (
                        <div className="p-4 bg-red-100 rounded-lg">
                          <p className="text-sm font-medium text-red-800">
                            建议：请在专业指导下优先解决此项问题，再进行相关基础动作评估。
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </ContainerWithIcon>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}; 