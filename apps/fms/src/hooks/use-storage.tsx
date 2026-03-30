import { useState, useEffect, useCallback } from 'react';
import { storageManager, FMSLocalStorageManager } from '@/lib/storage';
import type { AssessmentRecord, UserSettings } from '@/lib/storage';
import type { FMSAssessmentData, TrainingPlanData } from '@/types/fms-data';

// 存储功能Hook
export function useStorage() {
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查存储支持
  useEffect(() => {
    const checkSupport = async () => {
      try {
        await storageManager.getStatistics();
        setIsSupported(true);
      } catch (err) {
        console.warn('IndexedDB 不可用，使用 localStorage 备份方案:', err);
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // 保存评估数据
  const saveAssessment = useCallback(async (
    assessmentData: FMSAssessmentData,
    trainingPlan?: TrainingPlanData,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      isStarred?: boolean;
    }
  ): Promise<number | string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupported) {
        const id = await storageManager.saveAssessment(assessmentData, trainingPlan, options);
        return id;
      } else {
        FMSLocalStorageManager.saveAssessment(assessmentData, trainingPlan, options);
        return assessmentData.sessionId;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 获取所有评估记录
  const getAllAssessments = useCallback(async (): Promise<AssessmentRecord[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupported) {
        return await storageManager.getAllAssessments();
      } else {
        return FMSLocalStorageManager.getAllAssessments();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 获取单个评估记录
  const getAssessmentById = useCallback(async (id: number): Promise<AssessmentRecord | undefined> => {
    if (!isSupported) return undefined;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await storageManager.getAssessmentById(id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMsg);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 获取最新评估记录
  const getLatestAssessment = useCallback(async (): Promise<AssessmentRecord | undefined> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupported) {
        const all = await storageManager.getAllAssessments();
        return all.length > 0 ? all[0] : undefined;
      } else {
        return FMSLocalStorageManager.getLatestAssessment();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMsg);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 删除评估记录
  const deleteAssessment = useCallback(async (id: number | string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupported && typeof id === 'number') {
        await storageManager.deleteAssessment(id);
      } else if (typeof id === 'string') {
        FMSLocalStorageManager.deleteAssessment(id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 更新评估记录
  const updateAssessment = useCallback(async (
    id: number,
    updates: Partial<AssessmentRecord>
  ): Promise<void> => {
    if (!isSupported) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await storageManager.updateAssessment(id, updates);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 导出数据
  const exportData = useCallback(async (): Promise<string> => {
    if (!isSupported) {
      const data = FMSLocalStorageManager.getAllAssessments();
      return JSON.stringify({
        version: '1.0',
        exportDate: new Date().toISOString(),
        assessments: data
      }, null, 2);
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await storageManager.exportData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导出失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 导入数据
  const importData = useCallback(async (jsonData: string): Promise<{
    imported: number;
    errors: string[];
  }> => {
    if (!isSupported) {
      return { imported: 0, errors: ['备份存储模式不支持导入功能'] };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await storageManager.importData(jsonData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导入失败';
      setError(errorMsg);
      return { imported: 0, errors: [errorMsg] };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 获取统计信息
  const getStatistics = useCallback(async () => {
    if (!isSupported) {
      const assessments = FMSLocalStorageManager.getAllAssessments();
      return {
        totalAssessments: assessments.length,
        starredAssessments: 0,
        avgScore: assessments.length > 0 
          ? assessments.reduce((sum, a) => sum + a.assessmentData.totalScore, 0) / assessments.length 
          : 0,
        latestAssessment: assessments.length > 0 ? assessments[0].createdAt : undefined
      };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await storageManager.getStatistics();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取统计失败';
      setError(errorMsg);
      return {
        totalAssessments: 0,
        starredAssessments: 0,
        avgScore: 0,
        latestAssessment: undefined
      };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isLoading,
    error,
    saveAssessment,
    getAllAssessments,
    getAssessmentById,
    getLatestAssessment,
    deleteAssessment,
    updateAssessment,
    exportData,
    importData,
    getStatistics
  };
}

// 设置管理Hook
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载设置
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userSettings = await storageManager.getSettings();
      setSettings(userSettings || {
        autoSave: true,
        maxRecords: 100,
        defaultTitle: 'FMS评估',
        notifications: true,
        darkMode: false
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载设置失败';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await storageManager.saveSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings } as UserSettings));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存设置失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    reloadSettings: loadSettings
  };
} 