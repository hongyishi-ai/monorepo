import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AssessmentRecord } from '@/lib/storage'
import { createStoreMonitor } from '@/hooks/useSentryStore'

// 创建 store 监控器
const monitor = createStoreMonitor('useDataStore')

// 统计数据接口
interface Statistics {
  totalAssessments: number
  starredAssessments: number
  avgScore: number
  latestAssessment?: Date
}

// 数据管理状态接口
interface DataState {
  // 评估记录
  assessments: AssessmentRecord[]
  latestAssessment: AssessmentRecord | null
  
  // 统计数据
  statistics: Statistics
  
  // 加载状态
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Actions
  setAssessments: (assessments: AssessmentRecord[]) => void
  setLatestAssessment: (assessment: AssessmentRecord | null) => void
  setStatistics: (statistics: Statistics) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 数据操作
  addAssessment: (assessment: AssessmentRecord) => void
  updateAssessment: (id: number, updates: Partial<AssessmentRecord>) => void
  removeAssessment: (id: number) => void
  
  // 便利方法
  getAssessmentById: (id: number) => AssessmentRecord | undefined
  getStarredAssessments: () => AssessmentRecord[]
  hasData: () => boolean
  needsRefresh: () => boolean
  markAsUpdated: () => void
  
  // 重置方法
  reset: () => void
}

const initialStatistics: Statistics = {
  totalAssessments: 0,
  starredAssessments: 0,
  avgScore: 0,
  latestAssessment: undefined
}

export const useDataStore = create<DataState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        assessments: [],
        latestAssessment: null,
        statistics: initialStatistics,
        isLoading: false,
        error: null,
        lastUpdated: null,

        // Actions
        setAssessments: (assessments: AssessmentRecord[]) => {
          try {
            monitor.logAction('setAssessments', { count: assessments.length })
            set({ 
              assessments, 
              lastUpdated: new Date(),
              error: null 
            }, false, 'setAssessments')
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to set assessments')
            monitor.logError(err, 'setAssessments')
            set({ error: err.message })
          }
        },

        setLatestAssessment: (assessment: AssessmentRecord | null) => {
          set({ 
            latestAssessment: assessment,
            lastUpdated: new Date() 
          }, false, 'setLatestAssessment')
        },

        setStatistics: (statistics: Statistics) => {
          set({ 
            statistics, 
            lastUpdated: new Date(),
            error: null 
          }, false, 'setStatistics')
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'setLoading')
        },

        setError: (error: string | null) => {
          set({ error, isLoading: false }, false, 'setError')
        },

        // 数据操作
        addAssessment: (assessment: AssessmentRecord) => {
          try {
            monitor.logAction('addAssessment', { assessmentId: assessment.id })
            const state = get()
            const newAssessments = [assessment, ...state.assessments]
            set({ 
              assessments: newAssessments,
              latestAssessment: assessment,
              lastUpdated: new Date()
            }, false, 'addAssessment')
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to add assessment')
            monitor.logError(err, 'addAssessment')
            set({ error: err.message })
          }
        },

        updateAssessment: (id: number, updates: Partial<AssessmentRecord>) => {
          const state = get()
          const updatedAssessments = state.assessments.map(assessment =>
            assessment.id === id ? { ...assessment, ...updates } : assessment
          )
          
          set({ 
            assessments: updatedAssessments,
            latestAssessment: state.latestAssessment?.id === id 
              ? { ...state.latestAssessment, ...updates }
              : state.latestAssessment,
            lastUpdated: new Date()
          }, false, 'updateAssessment')
        },

        removeAssessment: (id: number) => {
          try {
            monitor.logAction('removeAssessment', { assessmentId: id })
            const state = get()
            const filteredAssessments = state.assessments.filter(assessment => assessment.id !== id)
            
            set({ 
              assessments: filteredAssessments,
              latestAssessment: state.latestAssessment?.id === id 
                ? (filteredAssessments.length > 0 ? filteredAssessments[0] : null)
                : state.latestAssessment,
              lastUpdated: new Date()
            }, false, 'removeAssessment')
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to remove assessment')
            monitor.logError(err, 'removeAssessment')
            set({ error: err.message })
          }
        },

        // 便利方法
        getAssessmentById: (id: number) => {
          const state = get()
          return state.assessments.find(assessment => assessment.id === id)
        },

        getStarredAssessments: () => {
          const state = get()
          return state.assessments.filter(assessment => assessment.isStarred)
        },

        hasData: () => {
          const state = get()
          return state.assessments.length > 0
        },

        needsRefresh: () => {
          const state = get()
          if (!state.lastUpdated) return true
          
          // 如果超过5分钟没有更新，则需要刷新
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
          return state.lastUpdated.getTime() < fiveMinutesAgo
        },

        markAsUpdated: () => {
          set({ lastUpdated: new Date() }, false, 'markAsUpdated')
        },

        // 重置方法
        reset: () => {
          set({
            assessments: [],
            latestAssessment: null,
            statistics: initialStatistics,
            isLoading: false,
            error: null,
            lastUpdated: null
          }, false, 'reset')
        }
      }),
      {
        name: 'fms-data-store',
        // 只持久化核心数据，不持久化加载状态
        partialize: (state) => ({
          assessments: state.assessments,
          latestAssessment: state.latestAssessment,
          statistics: state.statistics,
          lastUpdated: state.lastUpdated
        }),
        version: 1
      }
    ),
    {
      name: 'fms-data-store'
    }
  )
) 