import { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardWithIcon, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { CheckCircle, Target, AlertTriangle, BarChart3, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, User, Ban, Building2, TrendingDown, Clock, CheckCheck, ArrowRight, Download, RotateCcw, ArrowLeft, Play } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAssessmentStore } from '@/stores/useAssessmentStore';
import { useStorage } from '@/hooks/use-storage';
import { generateComprehensiveTrainingPlan, type Exercise } from '@/lib/trainingAlgorithm';
import { BASIC_TESTS } from '@/data/fms-tests';

const TrainingPage = () => {
  // 使用Zustand store获取训练数据
  const { reportData, setLastVisitedPage, setReportData } = useAppStore();
  const { loadFromRecord } = useAssessmentStore();
  const { getAssessmentById } = useStorage();
  const [searchParams] = useSearchParams();

  const scores = reportData?.scores || {};
  const bilateralScores = reportData?.bilateralScores || {};

  const [expandedPhase, setExpandedPhase] = useState<string>('');
  const [expandedExercise, setExpandedExercise] = useState<string>('');

  // 记录当前页面访问并处理数据恢复
  useEffect(() => {
    setLastVisitedPage('training');

    // 检查是否需要从URL参数恢复数据
    const recordId = searchParams.get('recordId');
    if (recordId && (!reportData || Object.keys(reportData.scores || {}).length === 0)) {
      // 如果有recordId但没有reportData，则从存储中恢复数据
      const loadHistoryData = async () => {
        try {
          const record = await getAssessmentById(parseInt(recordId));
          if (record) {
            // 合并基础测试分数和排除测试分数
            const allScores = {
              ...record.assessmentData.basicScores,
              // 添加排除测试分数
              ...Object.fromEntries(
                record.assessmentData.clearanceResults.map(result => [
                  result.testId,
                  result.isPositive ? 0 : 1  // 阳性为0分，阴性为1分
                ])
              )
            };

            // 设置到AppStore用于训练方案生成
            const reportDataToSet = {
              scores: allScores,
              bilateralScores: record.assessmentData.bilateralScores,
              asymmetryIssues: record.assessmentData.asymmetryIssues,
              painfulTests: record.assessmentData.painfulTests,
              basicTests: record.assessmentData.completedTests.filter(id =>
                !record.assessmentData.clearanceResults.some(c => c.testId === id)
              ),
              clearanceTests: record.assessmentData.clearanceResults.map(c => c.testId),
              sessionId: record.sessionId
            };

            setReportData(reportDataToSet);

            // 同时设置到AssessmentStore，确保数据一致性
            loadFromRecord(record);
          }
        } catch (error) {
          console.error('加载历史记录失败:', error);
        }
      };

      loadHistoryData();
    }
  }, [setLastVisitedPage, searchParams, reportData, getAssessmentById, setReportData, loadFromRecord]);

  // 视频播放状态管理 - 优化内存使用和防止泄漏
  const [videoLoading, setVideoLoading] = useState<Set<string>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

  // 视频播放控制函数 - 添加边界检查和防重复
  const handleVideoLoadStart = (exerciseId: string) => {
    if (!exerciseId || typeof exerciseId !== 'string') return;

    setVideoLoading(prev => {
      if (prev.has(exerciseId)) return prev; // 避免重复添加
      const newSet = new Set(prev);
      newSet.add(exerciseId);
      return newSet;
    });

    // 清除之前的错误状态
    setVideoErrors(prev => {
      if (!prev.has(exerciseId)) return prev;
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  };

  const handleVideoLoadEnd = (exerciseId: string) => {
    if (!exerciseId || typeof exerciseId !== 'string') return;

    setVideoLoading(prev => {
      if (!prev.has(exerciseId)) return prev; // 避免无效操作
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  };

  const handleVideoError = (exerciseId: string) => {
    if (!exerciseId || typeof exerciseId !== 'string') return;

    setVideoErrors(prev => {
      if (prev.has(exerciseId)) return prev; // 避免重复添加
      const newSet = new Set(prev);
      newSet.add(exerciseId);
      return newSet;
    });

    setVideoLoading(prev => {
      if (!prev.has(exerciseId)) return prev;
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  };

  // 组件卸载时清理视频状态
  useEffect(() => {
    return () => {
      setVideoLoading(new Set());
      setVideoErrors(new Set());
    };
  }, []);

  // 检查视频文件是否存在的函数
  const getVideoPath = (exerciseId: string) => {
    return `/demo/exercises/${exerciseId}.webm`;
  };

  // 检查是否应该显示视频
  const shouldShowVideo = (exerciseId: string) => {
    // 排除没有视频的练习
    const exercisesWithoutVideo = ['ds-priority-correction'];
    return !exercisesWithoutVideo.includes(exerciseId);
  };

  // 合并双侧数据和基础数据
  const mergedScores = useMemo(() => {
    const merged = { ...scores };

    console.log('🔍 原始scores:', scores);
    console.log('🔍 原始bilateralScores:', bilateralScores);
    console.log('🔍 完整reportData:', reportData);

    // 添加双侧测试的左右分数
    Object.entries(bilateralScores).forEach(([testId, scoreData]) => {
      console.log(`🔍 处理双侧测试 ${testId}:`, scoreData);
      if (scoreData && typeof scoreData === 'object') {
        merged[`${testId}-left`] = scoreData.left;
        merged[`${testId}-right`] = scoreData.right;
        console.log(`✅ 添加 ${testId}-left: ${scoreData.left}, ${testId}-right: ${scoreData.right}`);

        // 新增：检查1分/0分组合
        if ((scoreData.left === 1 && scoreData.right === 0) || (scoreData.left === 0 && scoreData.right === 1)) {
          console.log(`🏥 检测到1分/0分组合: ${testId} (左${scoreData.left}/右${scoreData.right})`);
        }
      }
    });

    console.log('✅ TrainingPage数据修复完成:', merged);
    return merged;
  }, [scores, bilateralScores, reportData]);

  // 使用lib中的算法
  const comprehensiveTrainingPlan = useMemo(() => generateComprehensiveTrainingPlan(mergedScores), [mergedScores]);

  // 计算总分和风险评估 - 只计算基础测试分数，不包含排除测试
  const totalScore = useMemo(() => {
    const basicTestIds = BASIC_TESTS.map(test => test.id);
    return Object.entries(scores)
      .filter(([testId]) => basicTestIds.includes(testId))
      .reduce((sum, [, score]) => sum + (typeof score === 'number' ? score : 0), 0);
  }, [scores]);

  // 风险等级评估（以14分为分界线）
  const riskAssessment = useMemo(() => {
    if (comprehensiveTrainingPlan.hasPainIssues) {
      return { level: '需要关注', color: 'text-red-600', description: '存在疼痛信号' };
    } else if (totalScore <= 14) {
      return { level: '相对高风险', color: 'text-orange-600', description: '功能缺陷较多' };
    } else {
      return { level: '相对低风险', color: 'text-green-600', description: '功能状态良好' };
    }
  }, [comprehensiveTrainingPlan.hasPainIssues, totalScore]);

  // 页面进入时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 检查是否有评估数据
  if (!reportData || !scores || Object.keys(scores).length === 0) {
    return (
      <div className="brooklyn-section">
        <ContainerWithIcon
          icon={AlertTriangle}
          iconColor="text-muted-foreground"
          iconSize="2xl"
          iconPosition="center"
          iconOpacity={0.1}
          className="brooklyn-container max-w-2xl text-center"
        >
          <h1 className="brooklyn-title text-2xl mb-4">暂无训练数据</h1>
          <p className="brooklyn-text mb-8 max-w-md mx-auto">
            请先完成FMS功能性动作筛查，我们将根据您的评估结果生成个性化的训练方案。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/assessment">
              <Button className="brooklyn-button px-8">开始 FMS 评估</Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="brooklyn-button px-8 text-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
                查看历史记录
              </Button>
            </Link>
          </div>
        </ContainerWithIcon>
      </div>
    );
  }

  // 处理手风琴展开时的平滑滚动
  const handlePhaseChange = (value: string) => {
    setExpandedPhase(value);

    // 给手风琴动画足够的时间完全展开，然后滚动到该阶段
    setTimeout(() => {
      if (value) {
        const phaseElement = document.querySelector(`[data-phase="${value}"]`);
        if (phaseElement) {
          // 计算导航栏高度和适当的偏移量
          const navHeight = 72; // 导航栏高度约80px
          const extraOffset = 10; // 额外的缓冲空间
          const targetOffset = navHeight + extraOffset;

          // 获取元素位置并手动计算滚动位置
          const elementRect = phaseElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetScrollTop = scrollTop + elementRect.top - targetOffset;

          // 使用window.scrollTo获得更好的控制
          window.scrollTo({
            top: Math.max(0, targetScrollTop), // 确保不会滚动到负值
            behavior: 'smooth'
          });
        }
      }
    }, 400); // 增加延迟时间，确保手风琴动画完全展开
  };

  // 处理练习手风琴展开时的平滑滚动
  const handleExerciseChange = (value: string) => {
    setExpandedExercise(value);

    // 给手风琴动画足够的时间完全展开，然后滚动到该练习
    setTimeout(() => {
      if (value) {
        const exerciseElement = document.querySelector(`[data-exercise="${value}"]`);
        if (exerciseElement) {
          // 计算导航栏高度和适当的偏移量
          const navHeight = 72; // 导航栏高度约80px
          const extraOffset = 10; // 额外的缓冲空间
          const targetOffset = navHeight + extraOffset;

          // 获取元素位置并手动计算滚动位置
          const elementRect = exerciseElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetScrollTop = scrollTop + elementRect.top - targetOffset;

          // 使用window.scrollTo获得更好的控制
          window.scrollTo({
            top: Math.max(0, targetScrollTop), // 确保不会滚动到负值
            behavior: 'smooth'
          });
        }
      }
    }, 400); // 稍微短一些的延迟，因为练习手风琴较小
  };

  return (
    <div className="brooklyn-section">
      <div className="brooklyn-container max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20 minimal-fade-in">
          <h1 className="brooklyn-title mb-6">个性化纠正训练方案</h1>
          <p className="brooklyn-subtitle max-w-3xl mx-auto px-2 md:px-0">
            基于您的FMS评估结果，为您制定专业的分阶段纠正训练计划，
            <br className="hidden sm:inline" />
            系统性解决所有问题，循序渐进地改善动作功能。
          </p>
        </div>

        {/* 疼痛警告 */}
        {comprehensiveTrainingPlan.hasPainIssues && (
          <ContainerWithIcon
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconSize="lg"
            iconPosition="top-right"
            iconOpacity={0.15}
            className="mb-12 md:mb-16"
          >
            <Alert className="brooklyn-card border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>重要提醒：</strong>检测到疼痛信号，请优先处理疼痛问题。我们将为您提供完整的分阶段解决方案。
              </AlertDescription>
            </Alert>
          </ContainerWithIcon>
        )}

        {/* 训练计划概览 - 移动端集约化显示 */}
        <div className="brooklyn-grid grid-cols-2 lg:grid-cols-4 mb-12 md:mb-16 lg:mb-24 gap-2 md:gap-4">
          <CardWithIcon
            icon={Clock}
            iconColor="text-blue-600"
            iconSize="md"
            iconPosition="top-right"
            iconOpacity={0.08}
            className="brooklyn-card text-center"
          >
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="text-xl md:text-2xl font-light mb-2 text-blue-600">
                {comprehensiveTrainingPlan.phases.length}
              </div>
              <div className="brooklyn-text text-sm">训练阶段</div>
            </CardContent>
          </CardWithIcon>

          <CardWithIcon
            icon={Target}
            iconColor="text-green-600"
            iconSize="md"
            iconPosition="top-right"
            iconOpacity={0.08}
            className="brooklyn-card text-center"
          >
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="text-xl md:text-2xl font-light mb-2 text-green-600">
                {comprehensiveTrainingPlan.totalSteps}
              </div>
              <div className="brooklyn-text text-sm">纠正项目</div>
            </CardContent>
          </CardWithIcon>

          <CardWithIcon
            icon={BarChart3}
            iconColor="text-purple-600"
            iconSize="md"
            iconPosition="top-right"
            iconOpacity={0.08}
            className="brooklyn-card text-center"
          >
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="text-xl md:text-2xl font-light mb-2 text-purple-600">
                {comprehensiveTrainingPlan.estimatedWeeks}
              </div>
              <div className="brooklyn-text text-sm">预计周数</div>
            </CardContent>
          </CardWithIcon>

          <CardWithIcon
            icon={CheckCheck}
            iconColor={riskAssessment.color.replace('text-', 'text-')}
            iconSize="md"
            iconPosition="top-right"
            iconOpacity={0.08}
            className="brooklyn-card text-center"
          >
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className={`text-xl md:text-2xl font-light mb-2 ${riskAssessment.color}`}>
                {riskAssessment.level}
              </div>
              <div className="brooklyn-text text-sm">总体评估</div>
              <div className="brooklyn-text text-xs mt-1 text-muted-foreground">
                {riskAssessment.description} • {totalScore}/21分
              </div>
            </CardContent>
          </CardWithIcon>
        </div>

        {/* 分阶段训练计划 */}
        <div className="space-y-12 md:space-y-16 mb-12 md:mb-16 lg:mb-24">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-light mb-4">分阶段训练计划</h2>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="brooklyn-text">循序渐进</Badge>
              <Badge variant="outline" className="brooklyn-text">系统性纠正</Badge>
            </div>
          </div>

          {comprehensiveTrainingPlan.phases.length === 0 ? (
            <Card className="brooklyn-card bg-green-50 dark:bg-green-900/20 border-green-200">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-normal mb-4 text-green-900 dark:text-green-100">
                  动作功能优秀
                </h3>
                <p className="brooklyn-text text-green-700 dark:text-green-300 max-w-md mx-auto">
                  没有检测到需要纠正的功能问题。您可以进入常规训练或维护阶段。
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="grid space-y-4 md:space-y-6"
              value={expandedPhase}
              onValueChange={handlePhaseChange}
            >
              {comprehensiveTrainingPlan.phases.map((phase) => (
                <AccordionItem
                  key={phase.phase}
                  value={`phase-${phase.phase}`}
                  className="brooklyn-card border-none"
                  data-phase={`phase-${phase.phase}`}
                >
                  <AccordionTrigger className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg px-4 md:px-6 py-3 md:py-4 hover:no-underline hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30">
                    <div className="flex items-center gap-2 md:gap-4 w-full min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm md:text-base flex-shrink-0">
                        {phase.phase}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-lg md:text-xl mb-2 font-medium truncate">{phase.title}</div>
                        <p className="brooklyn-text text-sm">{phase.description}</p>
                        {phase.prerequisite && (
                          <div className="flex items-center gap-2 mt-2">
                            <ArrowRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span className="text-sm text-amber-700 dark:text-amber-300 truncate">{phase.prerequisite}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right mr-3 md:mr-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">预计周数</div>
                        <div className="text-lg font-medium">{phase.estimatedWeeks}周</div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="p-4 md:p-6 lg:p-8">
                    <div className="space-y-6 md:space-y-8">
                      {phase.correctionPlans.map((step) => (
                        <Card key={`${step.testId}-${step.step}`} className={`brooklyn-card border-l-4 ${step.priority === 'critical' ? 'border-l-red-500' :
                            step.priority === 'high' ? 'border-l-orange-500' :
                              step.priority === 'medium' ? 'border-l-blue-500' : 'border-l-green-500'
                          }`}>
                          <CardHeader className={`px-4 md:px-6 py-3 md:py-4 ${step.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                              step.priority === 'high' ? 'bg-orange-50 dark:bg-orange-900/20' :
                                step.priority === 'medium' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                  'bg-green-50 dark:bg-green-900/20'
                            }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base md:text-lg">
                                  <span className="inline-flex items-center gap-2 md:gap-3">
                                    <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-white font-normal text-xs md:text-sm flex-shrink-0 ${step.priority === 'critical' ? 'bg-red-600' :
                                        step.priority === 'high' ? 'bg-orange-600' :
                                          step.priority === 'medium' ? 'bg-blue-600' : 'bg-green-600'
                                      }`}>
                                      {step.step}
                                    </div>
                                    <span className="truncate">{step.testName}</span>
                                  </span>
                                </CardTitle>
                                <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 flex-wrap">
                                  <Badge variant={
                                    step.priority === 'critical' ? 'destructive' :
                                      step.priority === 'high' ? 'default' :
                                        step.priority === 'medium' ? 'secondary' : 'outline'
                                  } className="text-xs flex-shrink-0">
                                    {step.issue === 'pain' ? '疼痛信号' :
                                      step.issue === 'asymmetry_with_dysfunction' ? '功能障碍性不对称' :
                                        step.issue === 'dysfunction' ? '功能障碍' :
                                          step.issue === 'asymmetry_performance' ? '表现性不对称' : '优化改善'}
                                  </Badge>
                                  {step.side && step.side !== 'bilateral' && (
                                    <Badge variant="outline" className="text-xs flex items-center gap-1 flex-shrink-0">
                                      {step.side === 'left' ? (
                                        <>
                                          <ChevronLeft className="h-3 w-3" />
                                          左侧
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3" />
                                          右侧
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="p-4 md:p-6">
                            {step.issue === 'pain' ? (
                              // 疼痛情况的特殊处理
                              <div className="space-y-4 md:space-y-6">
                                <Alert className="brooklyn-card border-red-200 bg-red-50 dark:bg-red-900/20">
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                  <AlertDescription className="text-red-800 dark:text-red-200">
                                    <strong>停止！请咨询医疗专业人士</strong><br />
                                    任何疼痛都必须被视为潜在的健康问题，需要专业诊断。
                                  </AlertDescription>
                                </Alert>

                                {/* 显示训练禁忌 */}
                                {step.contraindications && (
                                  <div className="space-y-3 md:space-y-4">
                                    <h4 className="font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                                      <Ban className="h-4 w-4" />
                                      训练禁忌
                                    </h4>

                                    <div className="brooklyn-grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                      <div className="bg-red-50 dark:bg-red-900/20 p-3 md:p-4 rounded-lg">
                                        <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">避免的训练</h5>
                                        <ul className="brooklyn-text text-red-700 dark:text-red-300 space-y-1">
                                          {step.contraindications.redLight?.map((item: string, index: number) => (
                                            <li key={index} className="text-sm">• {item}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 md:p-4 rounded-lg">
                                        <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">谨慎使用</h5>
                                        <ul className="brooklyn-text text-yellow-700 dark:text-yellow-300 space-y-1">
                                          {step.contraindications.yellowLight?.map((item: string, index: number) => (
                                            <li key={index} className="text-sm">• {item}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg">
                                        <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">安全训练</h5>
                                        <ul className="brooklyn-text text-green-700 dark:text-green-300 space-y-1">
                                          {step.contraindications.greenLight?.map((item: string, index: number) => (
                                            <li key={index} className="text-sm">• {item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // 正常训练方案
                              <div className="space-y-4 md:space-y-6">
                                {/* 纠正策略 */}
                                <div className="bg-muted/50 p-4 md:p-6 rounded-lg">
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    纠正策略
                                  </h4>
                                  <p className="brooklyn-text text-sm md:text-base">
                                    {step.strategy}
                                  </p>
                                </div>

                                {/* 纠正练习 */}
                                {step.exercises.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-4 flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      纠正练习方案
                                    </h4>
                                    <Accordion
                                      type="single"
                                      collapsible
                                      className="space-y-2 md:space-y-4"
                                      value={expandedExercise}
                                      onValueChange={handleExerciseChange}
                                    >
                                      {step.exercises.map((exercise: Exercise) => (
                                        <AccordionItem
                                          key={exercise.id}
                                          value={exercise.id}
                                          className="brooklyn-card"
                                          data-exercise={exercise.id}
                                        >
                                          <AccordionTrigger className="px-4 md:px-6 py-3 md:py-4 hover:no-underline hover:bg-muted/30 rounded-t-lg">
                                            <div className="flex items-center justify-between w-full mr-2 md:mr-4 min-w-0">
                                              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-xs flex-shrink-0">
                                                  {exercise.type}
                                                </Badge>
                                                <div className="text-left min-w-0">
                                                  <h5 className="font-medium text-sm md:text-base truncate">{exercise.name}</h5>
                                                  <p className="brooklyn-text text-xs md:text-sm truncate">{exercise.parameters}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </AccordionTrigger>

                                          <AccordionContent className="px-4 md:px-6 pb-4 md:pb-6">
                                            <div className="space-y-4 pt-2">
                                              <p className="brooklyn-text">{exercise.description}</p>

                                              {/* 视频演示区域 - 只有当视频文件存在时才显示 */}
                                              {shouldShowVideo(exercise.id) && !videoErrors.has(exercise.id) && (
                                                <div className="bg-muted/30 p-3 md:p-4 rounded-lg">
                                                  <h6 className="font-medium mb-3 flex items-center gap-2 text-sm md:text-base">
                                                    <Play className="h-4 w-4 text-blue-600" />
                                                    动作演示视频
                                                    {videoLoading.has(exercise.id) && (
                                                      <span className="text-xs text-muted-foreground ml-2">加载中...</span>
                                                    )}
                                                  </h6>
                                                  <div className="relative bg-black rounded-lg overflow-hidden">
                                                    <video
                                                      className="w-full h-auto max-h-80 object-contain"
                                                      controls
                                                      preload="metadata"
                                                      playsInline
                                                      poster={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                                                      <svg width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
                                                        <rect width="100%" height="100%" fill="#f8f9fa"/>
                                                        <g transform="translate(50%, 50%)">
                                                          <circle cx="0" cy="0" r="30" fill="#3b82f6" opacity="0.8"/>
                                                          <polygon points="-10,-10 -10,10 15,0" fill="white"/>
                                                        </g>
                                                        <text x="50%" y="75%" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="14">
                                                          点击播放：${exercise.name}
                                                        </text>
                                                      </svg>
                                                    `)}`}
                                                      onLoadStart={() => handleVideoLoadStart(exercise.id)}
                                                      onLoadedData={() => handleVideoLoadEnd(exercise.id)}
                                                      onError={() => handleVideoError(exercise.id)}
                                                    >
                                                      <source src={getVideoPath(exercise.id)} type="video/webm" />
                                                      <div className="flex items-center justify-center h-48 bg-muted text-muted-foreground">
                                                        <div className="text-center">
                                                          <Play className="h-8 w-8 mx-auto mb-2" />
                                                          <p className="text-sm">您的浏览器不支持视频播放</p>
                                                        </div>
                                                      </div>
                                                    </video>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-2 text-center">
                                                    💡 建议先观看视频演示，再对照文字说明进行练习
                                                  </p>
                                                </div>
                                              )}

                                              <div className="space-y-3">
                                                <h6 className="font-medium">动作要领</h6>
                                                <ul className="brooklyn-text space-y-2">
                                                  {exercise.instructions.map((instruction: string, instIndex: number) => (
                                                    <li key={instIndex} className="flex items-start gap-3">
                                                      <span className="text-primary font-medium min-w-[20px]">{instIndex + 1}.</span>
                                                      <span>{instruction}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>

                                              {exercise.precautions && exercise.precautions.length > 0 && (
                                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 md:p-4 rounded-lg">
                                                  <h6 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    注意事项
                                                  </h6>
                                                  <ul className="brooklyn-text text-amber-700 dark:text-amber-300 space-y-1 text-sm md:text-base">
                                                    {exercise.precautions.map((precaution: string, precIndex: number) => (
                                                      <li key={precIndex}>• {precaution}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}

                                              <div className="brooklyn-grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                                {exercise.progression && (
                                                  <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg">
                                                    <h6 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                                                      <TrendingUp className="h-4 w-4" />
                                                      进阶
                                                    </h6>
                                                    <p className="brooklyn-text text-green-700 dark:text-green-300 text-sm md:text-base">{exercise.progression}</p>
                                                  </div>
                                                )}

                                                {exercise.regression && (
                                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-lg">
                                                    <h6 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                                                      <TrendingDown className="h-4 w-4" />
                                                      退阶
                                                    </h6>
                                                    <p className="brooklyn-text text-blue-700 dark:text-blue-300 text-sm md:text-base">{exercise.regression}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      ))}
                                    </Accordion>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* 训练计划指导 */}
        <div>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="training-guidance" className="brooklyn-card">
              <AccordionTrigger className="px-4 md:px-6 py-3 md:py-4 hover:no-underline hover:bg-muted/30 rounded-t-lg">
                <div className="flex items-center gap-3 md:gap-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg md:text-xl font-medium">训练执行指导</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 md:px-6 pb-4 md:pb-6">
                <div className="space-y-6 md:space-y-8 pt-4">
                  <div className="brooklyn-grid grid-cols-2 md:grid-cols-4 mb-6 md:mb-8 gap-2 md:gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-6 rounded-lg text-center">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm md:text-base">1. 准备阶段</h4>
                      <p className="brooklyn-text text-blue-700 dark:text-blue-300 text-sm">5-10分钟</p>
                      <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 mt-2">自我筋膜放松</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 md:p-6 rounded-lg text-center">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 text-sm md:text-base">2. 活动度</h4>
                      <p className="brooklyn-text text-green-700 dark:text-green-300 text-sm">5分钟</p>
                      <p className="text-xs md:text-sm text-green-600 dark:text-green-400 mt-2">关节活动范围训练</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 md:p-6 rounded-lg text-center">
                      <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2 text-sm md:text-base">3. 稳定性</h4>
                      <p className="brooklyn-text text-orange-700 dark:text-orange-300 text-sm">5分钟</p>
                      <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400 mt-2">运动控制训练</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 md:p-6 rounded-lg text-center">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 text-sm md:text-base">4. 模式整合</h4>
                      <p className="brooklyn-text text-purple-700 dark:text-purple-300 text-sm">可选</p>
                      <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 mt-2">低负荷动作练习</p>
                    </div>
                  </div>

                  <div className="brooklyn-grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="p-4 md:p-6 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-sm md:text-base">
                        <RefreshCw className="h-4 w-4" />
                        训练频率建议
                      </h4>
                      <ul className="brooklyn-text space-y-2 text-sm md:text-base">
                        <li>• 疼痛阶段：遵医嘱，配合康复</li>
                        <li>• 功能纠正：每周3-4次</li>
                        <li>• 质量优化：每周2-3次</li>
                        <li>• 4-6周重新评估一次</li>
                      </ul>
                    </div>

                    <div className="p-4 md:p-6 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-sm md:text-base">
                        <CheckCircle className="h-4 w-4" />
                        阶段过渡标准
                      </h4>
                      <ul className="brooklyn-text space-y-2 text-sm md:text-base">
                        <li>• 疼痛完全消失</li>
                        <li>• 动作质量明显改善</li>
                        <li>• 能稳定维持1-2周</li>
                        <li>• 重新测试达标</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center mt-12 md:mt-16">
          <Link to="/report">
            <Button variant="outline" className="brooklyn-button px-6 md:px-8 text-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回报告页
            </Button>
          </Link>
          <Link to="/assessment">
            <Button variant="outline" className="brooklyn-button px-6 md:px-8 text-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
              <RotateCcw className="w-4 h-4 mr-2" />
              重新评估
            </Button>
          </Link>
          <Button
            onClick={() => window.print()}
            className="brooklyn-button px-6 md:px-8"
          >
            <Download className="w-4 h-4 mr-2" />
            下载训练方案
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage; 