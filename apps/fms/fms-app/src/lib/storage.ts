import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { FMSAssessmentData, TrainingPlanData } from '@/types/fms-data';

// 评估记录数据结构
export interface AssessmentRecord {
  id?: number;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description?: string;
  assessmentData: FMSAssessmentData;
  trainingPlan?: TrainingPlanData;
  isStarred: boolean;
  tags: string[];
}

// 用户偏好设置
export interface UserSettings {
  id?: number;
  autoSave: boolean;
  maxRecords: number;
  defaultTitle: string;
  notifications: boolean;
  darkMode: boolean;
}

// IndexedDB 数据库类
class FMSDatabase extends Dexie {
  assessments!: Table<AssessmentRecord>;
  settings!: Table<UserSettings>;

  constructor() {
    super('FMSDatabase');
    
    this.version(1).stores({
      assessments: '++id, sessionId, createdAt, updatedAt, title, tags',
      settings: '++id'
    });
  }
}

const db = new FMSDatabase();

// 存储管理器类
export class FMSStorageManager {
  private static instance: FMSStorageManager;
  private db: FMSDatabase;

  private constructor() {
    this.db = db;
  }

  static getInstance(): FMSStorageManager {
    if (!FMSStorageManager.instance) {
      FMSStorageManager.instance = new FMSStorageManager();
    }
    return FMSStorageManager.instance;
  }

  // 保存评估记录
  async saveAssessment(
    assessmentData: FMSAssessmentData,
    trainingPlan?: TrainingPlanData,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      isStarred?: boolean;
    }
  ): Promise<number> {
    const now = new Date();
    const record: AssessmentRecord = {
      sessionId: assessmentData.sessionId,
      createdAt: now,
      updatedAt: now,
      title: options?.title || `FMS评估 - ${now.toLocaleDateString()}`,
      description: options?.description,
      assessmentData,
      trainingPlan,
      isStarred: options?.isStarred ?? false,
      tags: options?.tags ?? []
    };

    const id = await this.db.assessments.add(record);
    
    // 自动清理旧记录（保留最近100条）
    await this.cleanupOldRecords();
    
    return id;
  }

  // 更新评估记录
  async updateAssessment(
    id: number,
    updates: Partial<AssessmentRecord>
  ): Promise<void> {
    await this.db.assessments.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // 获取所有评估记录
  async getAllAssessments(): Promise<AssessmentRecord[]> {
    return await this.db.assessments
      .orderBy('createdAt')
      .reverse()
      .toArray();
  }

  // 根据ID获取评估记录
  async getAssessmentById(id: number): Promise<AssessmentRecord | undefined> {
    return await this.db.assessments.get(id);
  }

  // 根据sessionId获取评估记录
  async getAssessmentBySessionId(sessionId: string): Promise<AssessmentRecord | undefined> {
    return await this.db.assessments
      .where('sessionId')
      .equals(sessionId)
      .first();
  }

  // 获取收藏的评估记录
  async getStarredAssessments(): Promise<AssessmentRecord[]> {
    const allAssessments = await this.getAllAssessments();
    return allAssessments.filter(record => record.isStarred);
  }

  // 根据标签搜索
  async searchAssessmentsByTag(tag: string): Promise<AssessmentRecord[]> {
    const allAssessments = await this.db.assessments.toArray();
    return allAssessments
      .filter(record => record.tags.includes(tag))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // 删除评估记录
  async deleteAssessment(id: number): Promise<void> {
    await this.db.assessments.delete(id);
  }

  // 批量删除评估记录
  async deleteAssessments(ids: number[]): Promise<void> {
    await this.db.assessments.bulkDelete(ids);
  }

  // 清理旧记录
  private async cleanupOldRecords(): Promise<void> {
    // 根据用户设置或默认值确定最大保留数量
    const settings = await this.getSettings();
    const maxRecords = settings?.maxRecords ?? 100;

    // 当前评估记录总数
    const totalCount = await this.db.assessments.count();
    if (totalCount <= maxRecords) return;

    // 需要删除的条数
    const surplus = totalCount - maxRecords;

    // 按创建时间升序获取所有非收藏记录（越早的在前）
    const nonStarredRecords = await this.db.assessments
      .orderBy('createdAt')
      .toArray()
      .then((records) => records.filter((r) => !r.isStarred));

    // 如果非收藏记录不足以腾出空间，则保留现有数据（避免误删收藏记录）
    if (nonStarredRecords.length === 0) return;

    const idsToDelete = nonStarredRecords
      .slice(0, surplus)
      .map((r) => r.id!) // `id` 在数据库中始终存在
      .filter(Boolean);

    if (idsToDelete.length > 0) {
      await this.deleteAssessments(idsToDelete);
    }
  }

  // 导出数据
  async exportData(): Promise<string> {
    const assessments = await this.getAllAssessments();
    const settings = await this.getSettings();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      assessments,
      settings
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // 导入数据
  async importData(jsonData: string): Promise<{
    imported: number;
    errors: string[];
  }> {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;
      const errors: string[] = [];

      if (data.assessments && Array.isArray(data.assessments)) {
        for (const assessment of data.assessments) {
          try {
            // 生成新的sessionId避免冲突
            const newSessionId = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            
            await this.saveAssessment(
              {
                ...assessment.assessmentData,
                sessionId: newSessionId
              },
              assessment.trainingPlan,
              {
                title: `[导入] ${assessment.title}`,
                description: assessment.description,
                tags: [...(assessment.tags || []), '导入数据'],
                isStarred: assessment.isStarred
              }
            );
            imported++;
          } catch (error) {
            errors.push(`记录导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }
      }

      if (data.settings) {
        try {
          await this.saveSettings(data.settings);
        } catch (error) {
          errors.push(`设置导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { imported, errors };
    } catch (error) {
      return {
        imported: 0,
        errors: [`数据格式错误: ${error instanceof Error ? error.message : '未知错误'}`]
      };
    }
  }

  // 获取统计信息
  async getStatistics(): Promise<{
    totalAssessments: number;
    starredAssessments: number;
    avgScore: number;
    latestAssessment?: Date;
  }> {
    const assessments = await this.getAllAssessments();
    const starredCount = assessments.filter(a => a.isStarred).length;
    
    const avgScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.assessmentData.totalScore, 0) / assessments.length
      : 0;
    
    const latestAssessment = assessments.length > 0 
      ? assessments[0].createdAt 
      : undefined;

    return {
      totalAssessments: assessments.length,
      starredAssessments: starredCount,
      avgScore: Math.round(avgScore * 10) / 10,
      latestAssessment
    };
  }

  // 设置相关方法
  async getSettings(): Promise<UserSettings | undefined> {
    return await this.db.settings.orderBy('id').last();
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    const existing = await this.getSettings();
    
    if (existing) {
      await this.db.settings.update(existing.id!, settings);
    } else {
      await this.db.settings.add({
        autoSave: true,
        maxRecords: 100,
        defaultTitle: 'FMS评估',
        notifications: true,
        darkMode: false,
        ...settings
      });
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    await this.db.assessments.clear();
    await this.db.settings.clear();
  }
}

// localStorage 备份方案（当 IndexedDB 不可用时）
export class FMSLocalStorageManager {
  private static readonly STORAGE_KEY = 'fms_assessments';

  static saveAssessment(
    assessmentData: FMSAssessmentData,
    trainingPlan?: TrainingPlanData,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      isStarred?: boolean;
    }
  ): void {
    try {
      // 检查localStorage可用性
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage不可用，无法保存数据');
        return;
      }

      const existing = this.getAllAssessments();
      const now = new Date();
      
      const record: AssessmentRecord = {
        id: Date.now(),
        sessionId: assessmentData.sessionId,
        createdAt: now,
        updatedAt: now,
        title: options?.title || `FMS评估 - ${now.toLocaleDateString()}`,
        description: options?.description,
        assessmentData,
        trainingPlan,
        isStarred: options?.isStarred ?? false,
        tags: options?.tags ?? []
      };

      const updated = [record, ...existing.slice(0, 49)]; // 保留最近50条
      const serializedData = JSON.stringify(updated);
      
      // 检查存储空间
      if (this.wouldExceedQuota(serializedData)) {
        console.warn('存储空间不足，尝试清理旧数据');
        const reducedData = [record, ...existing.slice(0, 20)]; // 减少到20条
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedData));
      } else {
        localStorage.setItem(this.STORAGE_KEY, serializedData);
      }
    } catch (error) {
      if (error instanceof Error) {
        // 处理具体的存储错误
        if (error.name === 'QuotaExceededError') {
          console.warn('存储配额已满，尝试清理空间');
          this.clearOldData();
        } else if (error.name === 'SecurityError') {
          console.warn('私密浏览模式下localStorage受限');
        } else {
          console.warn('localStorage保存失败:', error.message);
        }
      } else {
        console.warn('localStorage保存失败:', error);
      }
    }
  }

  static getAllAssessments(): AssessmentRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('localStorage 读取失败:', error);
      return [];
    }
  }

  static getLatestAssessment(): AssessmentRecord | undefined {
    const assessments = this.getAllAssessments();
    return assessments.length > 0 ? assessments[0] : undefined;
  }

  static deleteAssessment(identifier: string | number): void {
    try {
      const existing = this.getAllAssessments();
      const filtered = existing.filter(
        (a) => a.sessionId !== identifier && a.id !== identifier
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('localStorage 删除失败:', error);
    }
  }

  // 检查localStorage可用性
  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // 检查是否会超出存储配额
  private static wouldExceedQuota(data: string): boolean {
    try {
      // 估算当前localStorage使用量
      let currentSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          currentSize += localStorage[key].length + key.length;
        }
      }
      
      // 一般localStorage限制约为5-10MB，这里使用保守的4MB限制
      const maxSize = 4 * 1024 * 1024; // 4MB
      return (currentSize + data.length) > maxSize;
    } catch {
      return false; // 如果检查失败，假设不会超出配额
    }
  }

  // 清理旧数据
  private static clearOldData(): void {
    try {
      const existing = this.getAllAssessments();
      // 只保留最近10条记录
      const reduced = existing.slice(0, 10);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reduced));
    } catch (error) {
      console.warn('清理旧数据失败:', error);
    }
  }
}

// 创建全局存储管理器实例
export const storageManager = FMSStorageManager.getInstance(); 