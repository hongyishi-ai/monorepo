import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAssessmentStore } from '@/stores/useAssessmentStore';
import { useStorage } from '@/hooks/use-storage';
import { useReportData } from '@/hooks/useReportData';
import { BASIC_TESTS, CLEARANCE_TESTS } from '@/data/fms-tests';

/**
 * 阶段四自定义Hook：统一的报告数据流管理
 * 
 * 遵循React哲学核心原则：
 * - 单向数据流：统一管理数据获取和状态更新
 * - 状态提升：将复杂的数据恢复逻辑抽离到专门的Hook
 * - 关注点分离：分离数据获取、恢复、计算逻辑
 * - 简化组件：让ReportPage专注于渲染，不处理数据流
 */
export const useReportDataFlow = () => {
  const { reportData, setLastVisitedPage, setReportData } = useAppStore();
  const { loadFromRecord } = useAssessmentStore();
  const { getAssessmentById } = useStorage();
  const [searchParams] = useSearchParams();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);

  // 数据恢复逻辑 - 遵循React哲学的"副作用隔离"原则
  useEffect(() => {
    setLastVisitedPage('report');
    
    const recordId = searchParams.get('recordId');
    if (recordId) {
      const loadHistoryData = async () => {
        setIsLoadingHistory(true);
        setHistoryLoadError(null);
        
        try {
          const record = await getAssessmentById(parseInt(recordId));
          if (record) {
            // 合并基础测试分数和排除测试分数 - 遵循"数据变换"原则
            const allScores = {
              ...record.assessmentData.basicScores,
              ...Object.fromEntries(
                record.assessmentData.clearanceResults.map(result => [
                  result.testId,
                  result.isPositive ? 0 : 1
                ])
              )
            };

            // 构造统一的报告数据结构 - 遵循"不可变性"原则
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
            
            // 单向数据流：统一更新两个store的状态
            setReportData(reportDataToSet);
            loadFromRecord(record);
          } else {
            setHistoryLoadError('未找到指定的历史记录');
          }
        } catch (error) {
          console.error('加载历史记录失败:', error);
          setHistoryLoadError('加载历史记录时发生错误');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      
      loadHistoryData();
    }
  }, [setLastVisitedPage, searchParams, getAssessmentById, setReportData, loadFromRecord]);

  // 数据有效性检查 - 遵循"防御性编程"原则
  const isDataValid = reportData?.scores && Object.keys(reportData.scores).length > 0;

  // 修复：始终调用useReportData Hook，避免条件性调用 - 遵循React Hooks规则
  const reportAnalysis = useReportData({
    scores: reportData?.scores || {},
    asymmetryIssues: reportData?.asymmetryIssues || {},
    painfulTests: reportData?.painfulTests || [],
    basicTestIds: reportData?.basicTests || BASIC_TESTS.map(t => t.id),
    clearanceTestIds: reportData?.clearanceTests || CLEARANCE_TESTS.map(t => t.id),
  });

  // 返回完整的数据流状态 - 遵循"透明性"原则
  return {
    // 原始数据
    reportData,
    bilateralScores: reportData?.bilateralScores || {},
    
    // 计算后的分析数据 - 只有在数据有效时才返回
    reportAnalysis: isDataValid ? reportAnalysis : null,
    
    // 加载状态
    isLoadingHistory,
    historyLoadError,
    
    // 数据状态
    isDataValid,
    hasData: isDataValid,
    
    // 便利方法
    getRecordId: () => searchParams.get('recordId'),
    isHistoryMode: () => Boolean(searchParams.get('recordId'))
  };
}; 