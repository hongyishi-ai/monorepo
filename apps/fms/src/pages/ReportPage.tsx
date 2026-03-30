import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { 
  ReportSummary, 
  RiskAlerts, 
  ScoreRadarChart, 
  AsymmetryAnalysisCard,
  DetailedScoreResults,
  BiomechanicalAnalysis,
  PathologyAnalysis,
  ImprovementRecommendations
} from '@/components/report';
import { useReportDataFlow } from '@/hooks/useReportDataFlow';
import { CLEARANCE_TEST_PATHOLOGY } from '@/data/fms-biomechanics';
import { getAsymmetryRiskAssessment } from '@/data/fms-tests';
import { AlertTriangle, Download, RotateCcw, Loader2 } from 'lucide-react';

/**
 * 阶段四重构后的ReportPage组件
 * 
 * 遵循React哲学核心原则：
 * - 组件专注渲染：所有数据处理逻辑已抽离到useReportDataFlow Hook
 * - 单向数据流：数据流向清晰，状态管理统一
 * - 声明式UI：基于数据状态渲染，无命令式操作
 * - 组合模式：通过组合专门的组件构建完整页面
 * - 关注点分离：UI渲染与数据逻辑完全分离
 */
const ReportPage = () => {
  // 使用阶段四的统一数据流Hook - 遵循"状态提升"原则
  const {
    reportData,
    bilateralScores,
    reportAnalysis,
    isLoadingHistory,
    historyLoadError,
    hasData,
    getRecordId
  } = useReportDataFlow();

  // 历史记录加载状态处理 - 遵循"条件渲染"原则
  if (isLoadingHistory) {
    return (
      <div className="brooklyn-section">
        <ContainerWithIcon
          icon={Loader2}
          iconColor="text-primary"
          iconSize="2xl"
          iconPosition="center"
          iconOpacity={0.8}
          className="brooklyn-container max-w-2xl text-center"
        >
          <div className="animate-spin mb-4">
            <Loader2 className="w-8 h-8 mx-auto text-primary" />
          </div>
          <h1 className="brooklyn-title text-2xl mb-4">加载历史记录中...</h1>
          <p className="brooklyn-text">正在恢复评估数据，请稍候</p>
        </ContainerWithIcon>
      </div>
    );
  }

  // 历史记录加载错误处理 - 遵循"错误边界"原则
  if (historyLoadError) {
    return (
      <div className="brooklyn-section">
        <ContainerWithIcon
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconSize="2xl"
          iconPosition="center"
          iconOpacity={0.1}
          className="brooklyn-container max-w-2xl text-center"
        >
          <h1 className="brooklyn-title text-2xl mb-4 text-red-600">加载失败</h1>
          <p className="brooklyn-text mb-8 max-w-md mx-auto text-red-500">
            {historyLoadError}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/history">
              <Button variant="outline" className="brooklyn-button">返回历史记录</Button>
            </Link>
            <Link to="/assessment">
              <Button className="brooklyn-button">开始新评估</Button>
            </Link>
          </div>
        </ContainerWithIcon>
      </div>
    );
  }

  // 无数据状态处理 - 遵循"防御性渲染"原则
  if (!hasData || !reportAnalysis) {
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
          <h1 className="brooklyn-title text-2xl mb-4">暂无评估数据</h1>
          <p className="brooklyn-text mb-8 max-w-md mx-auto">
            请先完成FMS功能性动作筛查，我们将为您生成详细的专业分析报告。
          </p>
          <Link to="/assessment">
            <Button className="brooklyn-button px-8">开始 FMS 评估</Button>
          </Link>
        </ContainerWithIcon>
      </div>
    );
  }

  // 主渲染逻辑 - 遵循"声明式UI"原则
  // 所有数据计算已在useReportDataFlow和useReportData中完成
  const {
    basicScoreData,
    clearanceAnalysis,
    asymmetryAnalysis,
    chartData,
    lowScoringTests,
    assessmentStatus,
    testMap,
    testNameMap
  } = reportAnalysis;

  // 降低重复与干扰：
  // 1) 当存在排除测试异常时，疼痛提示由 PathologyAnalysis 负责，RiskAlerts 不再重复展示疼痛项
  const painfulForRiskAlerts = (clearanceAnalysis.failedTests.length > 0)
    ? []
    : (reportData?.painfulTests || []);

  // 2) 不对称分析卡片仅展示中/高风险项（轻度不对称只在详细结果中以 Badge 标注）
  const filteredAsymmetryIssues = Object.fromEntries(
    Object.entries(reportData?.asymmetryIssues || {}).filter(([, v]: any) => v && v.riskLevel && v.riskLevel !== 'low')
  );

  return (
    <div className="brooklyn-section">
      <div className="brooklyn-container max-w-7xl">
        {/* 报告摘要组件 - 遵循React哲学的组合原则 */}
        <div role="region" aria-label="报告摘要">
          <ReportSummary
            totalScore={basicScoreData.totalScore}
            maxScore={basicScoreData.maxScore}
            assessmentStatus={assessmentStatus}
          />
        </div>

        {/* 顶部显眼的“查看专业康复方案”按钮 */}
        <div className="hidden md:flex justify-center mb-12 md:mb-16" role="region" aria-label="前往训练方案">
          <Link to={`/training${getRecordId() ? `?recordId=${getRecordId()}` : ''}`}>
            <Button className="brooklyn-button px-8" aria-label="查看专业康复方案">
              查看专业康复方案
            </Button>
          </Link>
        </div>

        {/* 风险警告组件 - 遵循React哲学的条件渲染原则 */}
        <div role="region" aria-label="风险警告区域">
          <RiskAlerts
            painfulTests={painfulForRiskAlerts}
            testNameMap={testNameMap}
            highRiskAsymmetry={asymmetryAnalysis.highRiskCount}
            failedClearanceTests={clearanceAnalysis.failedTests}
          />
        </div>

        {/* 不对称性分析组件 - 遵循React哲学的条件渲染和组合原则 */}
        <AsymmetryAnalysisCard
          asymmetryIssues={filteredAsymmetryIssues}
          bilateralScores={bilateralScores}
          testMap={testMap}
          getAsymmetryRiskAssessment={getAsymmetryRiskAssessment}
        />

        {/* 雷达图可视化组件 - 遵循React哲学的组合和纯函数原则 */}
        <div
          role="region"
          aria-label="雷达图与动作模式分析"
          className={lowScoringTests.length >= 2 ? '' : 'hidden md:block'}
        >
          <ScoreRadarChart
            radarData={chartData.map(item => ({
              subject: item.subject,
              基础测试: item.score,
              最大分值: 3,
              fullMark: 3,
            }))}
          />
        </div>

        {/* 详细评分结果组件 */}
        <DetailedScoreResults
          basicTestsScores={basicScoreData.basicTestsScores}
          clearanceTestsScores={clearanceAnalysis.clearanceTestsScores}
          basicTotalScore={basicScoreData.totalScore}
          maxBasicScore={basicScoreData.maxScore}
          bilateralScores={bilateralScores}
          asymmetryIssues={reportData?.asymmetryIssues || {}}
          testNameMap={testNameMap}
        />

        {/* 详细分析区域 */}
                  <div className="space-y-12 md:space-y-20">
          {/* 生物力学分析组件 */}
          <BiomechanicalAnalysis
            basicTestsScores={basicScoreData.basicTestsScores}
            bilateralScores={bilateralScores}
          />

          {/* 病理分析组件 */}
          <PathologyAnalysis
            failedClearanceTests={clearanceAnalysis.failedTests}
            affectedBasicTests={clearanceAnalysis.affectedBasicTests}
            pathologyData={CLEARANCE_TEST_PATHOLOGY}
          />
        </div>

        {/* 改善建议组件 */}
        <ImprovementRecommendations
          lowScoringTests={lowScoringTests}
          asymmetryIssues={reportData?.asymmetryIssues || {}}
          testMap={testMap}
          searchParams={new URLSearchParams(getRecordId() ? `recordId=${getRecordId()}` : '')}
        />

        {/* 操作按钮 - 遵循"用户体验一致性"原则 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center mt-12 md:mt-16">
          <Link to="/assessment">
            <Button variant="outline" className="brooklyn-button px-8 text-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
              <RotateCcw className="w-4 h-4 mr-2" />
              重新评估
            </Button>
          </Link>
          <Button 
            onClick={() => window.print()} 
            className="brooklyn-button px-8 hidden sm:inline-flex"
          >
            <Download className="w-4 h-4 mr-2" />
            打印报告
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 
