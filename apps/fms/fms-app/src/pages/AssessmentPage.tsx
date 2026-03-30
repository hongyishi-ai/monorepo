import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestCard from '@/components/assessment/TestCard';
import BilateralScoringCard from '@/components/assessment/BilateralScoringCard';
import { FMS_TESTS, BASIC_TESTS, CLEARANCE_TESTS, CLEARANCE_TEST_MAPPINGS } from '@/data/fms-tests';
import { Button } from '@/components/ui/button';
import { SmartStatusIndicator } from '@/components/ui/smart-status-indicator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorage } from '@/hooks/use-storage';
import { useAssessmentStore } from '@/stores/useAssessmentStore';
import { useAppStore } from '@/stores/useAppStore';
import type { FMSAssessmentData } from '@/types/fms-data';

// 双侧评估数据结构
interface BilateralScores {
  left: number;
  right: number;
  final: number;
  asymmetryData: any;
}

// 排除测试与基础测试的映射关系已从 @/data/fms-tests 导入

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { saveAssessment } = useStorage();

  
  // 使用Zustand store替代local state
  const {
    sessionId,
    currentTestIndex,
    scores,
    bilateralScores,
    hasPainfulTests,
    asymmetryIssues,
    isAssessmentInProgress,
    startNewAssessment,
    setCurrentTestIndex,
    updateScore,
    updateBilateralScore,
    addPainfulTest,
    removePainfulTest,
    updateAsymmetryIssue,
    completeAssessment,
    forceResetAssessment
  } = useAssessmentStore();

  // 使用应用级store进行页面导航管理
  const { setReportData, setLastVisitedPage } = useAppStore();

  // 如果没有进行中的评估，开始新的评估
  useEffect(() => {
    if (!isAssessmentInProgress) {
      startNewAssessment();
    }
    
    // 记录当前页面访问
    setLastVisitedPage('assessment');
  }, [isAssessmentInProgress, startNewAssessment, setLastVisitedPage]);

  // 页面初始化时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 当测试索引变化时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTestIndex]);

  const currentTest = FMS_TESTS[currentTestIndex];
  const requiresBilateralAssessment = currentTest.requiresBilateralAssessment;

  // 应用排除测试影响的逻辑
  const applyClearanceTestEffects = (newScores: Record<string, number>) => {
    let updatedScores = { ...newScores };
    
    // 检查每个排除测试，如果为0分，则将对应的基础测试也设为0分
    Object.entries(CLEARANCE_TEST_MAPPINGS).forEach(([clearanceTestId, basicTestId]) => {
      if (updatedScores[clearanceTestId] === 0) {
        updatedScores[basicTestId] = 0;
        // 同时更新store中的分数
        updateScore(basicTestId, 0);
        // 也要添加到疼痛测试列表中
        if (!hasPainfulTests.includes(basicTestId)) {
          addPainfulTest(basicTestId);
        }
      }
    });
    
    return updatedScores;
  };

  // 重新检查所有排除性测试的影响（用于处理修改已有评分的情况）
  const reapplyAllClearanceTestEffects = () => {
    const currentScores = { ...scores };
    
    // 重新检查所有排除测试的影响
    Object.entries(CLEARANCE_TEST_MAPPINGS).forEach(([clearanceTestId, basicTestId]) => {
      if (currentScores[clearanceTestId] === 0 && currentScores[basicTestId] !== 0) {
        updateScore(basicTestId, 0);
        if (!hasPainfulTests.includes(basicTestId)) {
          addPainfulTest(basicTestId);
        }
      }
    });
  };

  // 获取下一个测试的索引，考虑跳过逻辑
  const getNextTestIndex = (currentIndex: number, currentScore: number): number => {
    const current = FMS_TESTS[currentIndex];
    
    // 如果当前是排除测试且阳性（0分），跳过对应的基础测试
    if (current.isClearanceTest && currentScore === 0) {
      const targetBasicTestId = CLEARANCE_TEST_MAPPINGS[current.id as keyof typeof CLEARANCE_TEST_MAPPINGS];
      if (targetBasicTestId) {
        // 找到对应基础测试的索引
        const basicTestIndex = FMS_TESTS.findIndex(test => test.id === targetBasicTestId);
        if (basicTestIndex > currentIndex) {
          // 跳过对应的基础测试，返回基础测试之后的索引
          return basicTestIndex + 1;
        }
      }
    }
    
    // 默认情况：返回下一个测试
    return currentIndex + 1;
  };

  // 保存评估数据并导航到报告页面
  const saveAndNavigateToReport = async (latestScores?: Record<string, number>, latestBilateralScores?: Record<string, BilateralScores>) => {
    try {
      // 使用传入的最新分数，如果没有传入则使用当前状态
      const currentScores = latestScores || scores;
      const currentBilateralScores = latestBilateralScores || bilateralScores;
      
      // 构造评估数据
      const assessmentData: FMSAssessmentData = {
        sessionId: sessionId || '',
        timestamp: new Date(),
        basicScores: currentScores,  // 使用最新的分数
        bilateralScores: currentBilateralScores,  // 使用最新的双侧数据
        clearanceResults: CLEARANCE_TESTS.map(test => ({
          testId: test.id,
          isPositive: currentScores[test.id] === 0,  // 使用最新的分数
          affectedBaseTest: CLEARANCE_TEST_MAPPINGS[test.id as keyof typeof CLEARANCE_TEST_MAPPINGS]
        })),
        totalScore: Object.entries(currentScores)
          .filter(([testId]) => BASIC_TESTS.some(test => test.id === testId))
          .reduce((sum, [, score]) => sum + score, 0),  // 只计算基础测试分数
        asymmetryIssues: asymmetryIssues,
        painfulTests: hasPainfulTests,
        riskFlags: [...hasPainfulTests, ...Object.keys(asymmetryIssues)],
        completedTests: Object.keys(currentScores),  // 使用最新的分数
        incompleteTests: [],
        testSequence: FMS_TESTS.map(t => t.id)
      };

      // 完成评估并保存到store
      completeAssessment(assessmentData);

      // 自动保存评估数据
      await saveAssessment(assessmentData, undefined, {
        title: `FMS评估 - ${new Date().toLocaleDateString()}`,
        description: `总分: ${assessmentData.totalScore}/21，${hasPainfulTests.length > 0 ? '存在疼痛问题' : '无疼痛问题'}`
      });

      // 使用Zustand store传递报告数据
      const reportData = {
        scores: currentScores,  // 使用最新的分数
        bilateralScores: currentBilateralScores,  // 使用最新的双侧数据
        asymmetryIssues: asymmetryIssues,
        painfulTests: hasPainfulTests,
        basicTests: BASIC_TESTS.map(t => t.id),
        clearanceTests: CLEARANCE_TESTS.map(t => t.id),
        sessionId: sessionId
      };
      
      setReportData(reportData);

      // 导航到报告页面（不再需要state参数）
      navigate('/report');
    } catch (error) {
      console.error('保存评估数据失败:', error);
      
      // 即使保存失败也要传递数据并导航
      const currentScores = latestScores || scores;
      const currentBilateralScores = latestBilateralScores || bilateralScores;
      const reportData = {
        scores: currentScores,  // 使用最新的分数
        bilateralScores: currentBilateralScores,  // 使用最新的双侧数据
        asymmetryIssues: asymmetryIssues,
        painfulTests: hasPainfulTests,
        basicTests: BASIC_TESTS.map(t => t.id),
        clearanceTests: CLEARANCE_TESTS.map(t => t.id),
        sessionId: sessionId
      };
      
      setReportData(reportData);
      navigate('/report');
    }
  };

  const handleScoreSelect = async (score: number) => {
    // 更新分数到store
    updateScore(currentTest.id, score);

    // 记录疼痛测试
    if (score === 0) {
      addPainfulTest(currentTest.id);
    } else {
      removePainfulTest(currentTest.id);
    }

    // 构造包含最新分数的状态
    const newScores = { ...scores, [currentTest.id]: score };
    
    // 应用排除测试影响逻辑
    const updatedScores = applyClearanceTestEffects(newScores);
    
    // 重新检查所有排除性测试的影响（处理用户修改已有评分的情况）
    setTimeout(() => reapplyAllClearanceTestEffects(), 100);
    
    // 检查是否需要跳过下一个测试
    const nextTestIndex = getNextTestIndex(currentTestIndex, score);
    
    if (nextTestIndex < FMS_TESTS.length) {
      setCurrentTestIndex(nextTestIndex);
    } else {
      // 这是最后一个测试，传入最新的分数状态以确保数据完整性
      await saveAndNavigateToReport(updatedScores);
    }
  };

  const handleBilateralScoreSubmit = async (scoreData: BilateralScores) => {
    // 更新双侧评分到store
    updateBilateralScore(currentTest.id, scoreData);
    
    // 更新最终分数
    updateScore(currentTest.id, scoreData.final);

    // 记录不对称性问题
    if (scoreData.asymmetryData.hasAsymmetry) {
      updateAsymmetryIssue(currentTest.id, scoreData.asymmetryData);
    }

    // 记录疼痛测试（左右任一侧有疼痛）
    if (scoreData.left === 0 || scoreData.right === 0) {
      addPainfulTest(currentTest.id);
    } else {
      removePainfulTest(currentTest.id);
    }

    // 构造包含最新分数的状态
    const newScores = { ...scores, [currentTest.id]: scoreData.final };
    
    // 应用排除测试影响逻辑
    const updatedScores = applyClearanceTestEffects(newScores);
    
    // 重新检查所有排除性测试的影响
    setTimeout(() => reapplyAllClearanceTestEffects(), 100);
    
    // 检查是否需要跳过下一个测试（对于双侧评分，传入最终分数）
    const nextTestIndex = getNextTestIndex(currentTestIndex, scoreData.final);
    
    if (nextTestIndex < FMS_TESTS.length) {
      setCurrentTestIndex(nextTestIndex);
    } else {
      // 这是最后一个测试，传入最新的分数和双侧数据以确保数据完整性
      const updatedBilateralScores = { ...bilateralScores, [currentTest.id]: scoreData };
      await saveAndNavigateToReport(updatedScores, updatedBilateralScores);
    }
  };

  const goToPreviousTest = () => {
    if (currentTestIndex > 0) {
      setCurrentTestIndex(currentTestIndex - 1);
    }
  };

  const goToNextTest = async () => {
    // 使用当前测试的分数（如果有）来决定跳转逻辑
    const currentScore = requiresBilateralAssessment 
      ? bilateralScores[currentTest.id]?.final ?? 1  // 默认1分，不跳过
      : scores[currentTest.id] ?? 1;
    
    const nextTestIndex = getNextTestIndex(currentTestIndex, currentScore);
    
    if (nextTestIndex < FMS_TESTS.length) {
      setCurrentTestIndex(nextTestIndex);
    } else {
      // 手动导航到最后一个测试时，使用当前的分数状态
      await saveAndNavigateToReport(scores);
    }
  };

  // 检查当前测试是否为排除性测试
  const isClearanceTest = currentTest.isClearanceTest;

  // 检查是否有评分数据
  const hasScore = requiresBilateralAssessment 
    ? bilateralScores[currentTest.id] !== undefined
    : scores[currentTest.id] !== undefined;

  return (
    <div className="brooklyn-section min-h-screen" role="region" aria-label="FMS评估流程">
      <div className="brooklyn-container max-w-6xl">
        {/* 紧凑的头部区域 - 只保留智能状态指示器 */}
        <div className="mb-6 md:mb-8" role="region" aria-label="评估进度与当前测试" aria-live="polite">
          <SmartStatusIndicator
            completedBasicTests={Object.keys(scores).filter(id => BASIC_TESTS.some(t => t.id === id)).length}
            totalBasicTests={BASIC_TESTS.length}
            completedClearanceTests={Object.keys(scores).filter(id => CLEARANCE_TESTS.some(t => t.id === id)).length}
            totalClearanceTests={CLEARANCE_TESTS.length}
            asymmetryCount={Object.keys(asymmetryIssues).length}
            painfulCount={hasPainfulTests.length}
            currentTestName={currentTest.name.split(' (')[0]}
            currentTestType={isClearanceTest ? 'clearance' : 'basic'}
            requiresBilateralAssessment={requiresBilateralAssessment}
          />
        </div>

        {/* 当前测试展示区域 - 紧凑布局 */}
        <div className="mb-6 md:mb-8" role="region" aria-label="当前测试内容">
          <TestCard test={currentTest} />
        </div>

        {/* 评分区域 - 紧凑布局 */}
        <div>
        {requiresBilateralAssessment ? (
          // 双侧评分组件
          <div className="mb-6 md:mb-8">
            <BilateralScoringCard
              key={currentTest.id}
              test={currentTest}
              onScoreSubmit={handleBilateralScoreSubmit}
              initialScores={bilateralScores[currentTest.id] ? {
                left: bilateralScores[currentTest.id].left,
                right: bilateralScores[currentTest.id].right
              } : {}}
            />
          </div>
        ) : (
          // 传统单一评分
          <Card className="brooklyn-card mb-6 md:mb-8" role="region" aria-label="动作评分">
            <CardContent className="p-4 md:p-8">
              <div className="text-center mb-4 md:mb-6">
                <h2 className="text-lg font-normal mb-2">
                  {isClearanceTest ? '排除测试评分' : '动作质量评分'}
                </h2>
                <p className="brooklyn-text text-sm mb-2">
                  请根据您的实际表现选择相应分数
                </p>
                {/* 移动端与桌面端分别显示更贴切的提示文案，降低困惑 */}
                <p className="brooklyn-text text-xs text-muted-foreground flex items-center justify-center gap-1 md:hidden">
                  <Eye className="w-3 h-3" />
                  请点击左下角演示指引查看评分标准
                </p>
                <p className="brooklyn-text text-xs text-muted-foreground hidden md:flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" />
                  查看评分标准请参阅上方动作卡片
                </p>
              </div>

              {/* 评分按钮 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 max-w-3xl mx-auto">
                {currentTest.scoringCriteria.map(({ score }) => (
                  <Button
                    key={score}
                    onClick={() => handleScoreSelect(score)}
                    variant={scores[currentTest.id] === score ? 'default' : 'outline'}
                    className={cn(
                      "h-auto p-3 md:p-4 text-left brooklyn-button transition-all duration-200 flex flex-col items-center gap-2",
                      score === 0 && "border-red-200 hover:border-red-300",
                      scores[currentTest.id] === score && score === 0 && "bg-red-500 hover:bg-red-600 text-white",
                      scores[currentTest.id] === score && score !== 0 && "bg-primary text-primary-foreground"
                    )}
                    aria-label={`评分${score}分：${
                      score === 0 ? "动作中出现疼痛" : 
                      isClearanceTest ? (
                        score === 1 ? "顺利通过，无疼痛" : "出现疼痛"
                      ) : (
                        score === 1 ? "无法按标准完成动作" : 
                        score === 2 ? "能够完成动作但存在代偿" : 
                        "完美地完成动作"
                      )
                    }`}
                  >
                    <div className={cn(
                      "text-2xl font-bold mb-1",
                      scores[currentTest.id] === score && score === 0 ? "text-white" : 
                      score === 0 ? "text-red-600" : 
                      scores[currentTest.id] === score ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {score}
                    </div>
                    <div className={cn(
                      "text-xs text-center leading-tight",
                      scores[currentTest.id] === score ? "text-current" : "text-muted-foreground"
                    )}>
                      {isClearanceTest ? (
                        score === 0 ? "出现疼痛" : "顺利通过"
                      ) : (
                        score === 0 ? "出现疼痛" : 
                        score === 1 ? "无法完成" : 
                        score === 2 ? "存在代偿" : 
                        "完美动作"
                      )}
                    </div>
                  </Button>
                ))}
              </div>

              {/* 疼痛提示 */}
              {scores[currentTest.id] === 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 brooklyn-card">
                  <div className="text-center space-y-2">
                    <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
                    <h4 className="font-medium text-red-800 text-sm">检测到疼痛</h4>
                    <p className="brooklyn-text text-red-700 max-w-xl mx-auto text-sm">
                      建议您暂停剧烈运动，并咨询专业医疗人员或物理治疗师的意见。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between items-center pb-6 md:pb-8" role="region" aria-label="评估导航">
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPreviousTest}
              variant="outline"
              disabled={currentTestIndex === 0}
              className={cn(
                "brooklyn-button px-8 border-2 shadow-sm text-foreground",
                currentTestIndex === 0 
                  ? "opacity-50 cursor-not-allowed border-muted text-muted-foreground" 
                  : "border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一项
            </Button>
          </div>

          <div className="brooklyn-text text-center">
            <p className="text-xs">
              {currentTestIndex + 1} / {FMS_TESTS.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentTest.name.split(' (')[0]}
            </p>
          </div>

          <Button
            onClick={goToNextTest}
            disabled={!hasScore}
            className={cn(
              "brooklyn-button px-8",
              !hasScore && "opacity-50 cursor-not-allowed"
            )}
          >
            {currentTestIndex === FMS_TESTS.length - 1 ? '完成评估' : '下一项'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* 调试信息和重置按钮（在开发环境显示） */}
        {!import.meta.env.PROD && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 brooklyn-card">
            <h3 className="text-sm font-medium mb-2">调试信息:</h3>
            <p className="text-xs mb-1">当前测试索引: {currentTestIndex}</p>
            <p className="text-xs mb-1">当前测试ID: {currentTest.id}</p>
            <p className="text-xs mb-1">需要双侧评分: {requiresBilateralAssessment ? '是' : '否'}</p>
            <p className="text-xs mb-1">已完成测试: {Object.keys(scores).length}</p>
            <p className="text-xs mb-1">已完成双侧测试: {Object.keys(bilateralScores).length}</p>
            <p className="text-xs mb-1">测试总数: {FMS_TESTS.length}</p>
            <p className="text-xs mb-2">所有测试ID: {FMS_TESTS.map(t => t.id).join(', ')}</p>
            <div className="space-y-1">
              <p className="text-xs">双侧评分状态:</p>
              <div className="text-xs pl-2">
                {Object.entries(bilateralScores).map(([testId, data]) => (
                  <p key={testId}>
                    {testId}: 左{data.left}/右{data.right}→{data.final}
                  </p>
                ))}
              </div>
            </div>
            <Button
              onClick={() => {
                if (confirm('确定要重置评估吗？这将清除所有进度。')) {
                  forceResetAssessment();
                  window.location.reload();
                }
              }}
              variant="destructive"
              size="sm"
              className="text-xs px-3 py-1 mt-2"
            >
              强制重置评估
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AssessmentPage; 
