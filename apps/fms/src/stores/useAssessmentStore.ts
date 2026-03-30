import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { FMSAssessmentData, AsymmetryData } from '@/types/fms-data'
import type { AssessmentRecord } from '@/lib/storage'

// 与AssessmentPage保持一致的双侧评分接口
interface BilateralScores {
  left: number;
  right: number;
  final: number;
  asymmetryData: any;
}

// 评估进行中的状态接口
interface AssessmentState {
  // 当前评估会话数据
  sessionId: string | null
  currentTestIndex: number
  scores: Record<string, number>
  bilateralScores: Record<string, BilateralScores>
  hasPainfulTests: string[]
  asymmetryIssues: Record<string, AsymmetryData>
  
  // 完整的评估数据（评估完成后）
  currentAssessment: FMSAssessmentData | null
  isAssessmentInProgress: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  startNewAssessment: () => void
  setCurrentTestIndex: (index: number) => void
  updateScore: (testId: string, score: number) => void
  updateBilateralScore: (testId: string, bilateralScore: BilateralScores) => void
  addPainfulTest: (testId: string) => void
  removePainfulTest: (testId: string) => void
  updateAsymmetryIssue: (testId: string, asymmetryData: AsymmetryData) => void
  completeAssessment: (assessmentData: FMSAssessmentData) => void
  loadFromRecord: (record: AssessmentRecord) => void
  clearAssessment: () => void
  forceResetAssessment: () => void // 强制重置，清除所有缓存
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 便利方法
  getTotalScore: () => number
  hasCompletedAllTests: () => boolean
  getCurrentTestCompletion: () => number
}

// 生成新的会话ID
const generateSessionId = (): string => {
  return `fms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useAssessmentStore = create<AssessmentState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sessionId: null,
        currentTestIndex: 0,
        scores: {},
        bilateralScores: {},
        hasPainfulTests: [],
        asymmetryIssues: {},
        currentAssessment: null,
        isAssessmentInProgress: false,
        isLoading: false,
        error: null,

        // Actions
        startNewAssessment: () => {
          const newSessionId = generateSessionId()
          set({
            sessionId: newSessionId,
            currentTestIndex: 0,
            scores: {},
            bilateralScores: {},
            hasPainfulTests: [],
            asymmetryIssues: {},
            currentAssessment: null,
            isAssessmentInProgress: true,
            error: null
          }, false, 'startNewAssessment')
        },

        setCurrentTestIndex: (index: number) => {
          set({ currentTestIndex: index }, false, 'setCurrentTestIndex')
        },

        updateScore: (testId: string, score: number) => {
          set((state) => ({
            scores: { ...state.scores, [testId]: score }
          }), false, 'updateScore')
        },

        updateBilateralScore: (testId: string, bilateralScore: BilateralScores) => {
          set((state) => ({
            bilateralScores: { ...state.bilateralScores, [testId]: bilateralScore }
          }), false, 'updateBilateralScore')
        },

        addPainfulTest: (testId: string) => {
          set((state) => ({
            hasPainfulTests: state.hasPainfulTests.includes(testId) 
              ? state.hasPainfulTests 
              : [...state.hasPainfulTests, testId]
          }), false, 'addPainfulTest')
        },

        removePainfulTest: (testId: string) => {
          set((state) => ({
            hasPainfulTests: state.hasPainfulTests.filter(id => id !== testId)
          }), false, 'removePainfulTest')
        },

        updateAsymmetryIssue: (testId: string, asymmetryData: AsymmetryData) => {
          set((state) => ({
            asymmetryIssues: { ...state.asymmetryIssues, [testId]: asymmetryData }
          }), false, 'updateAsymmetryIssue')
        },

        completeAssessment: (assessmentData: FMSAssessmentData) => {
          set({
            currentAssessment: assessmentData,
            isAssessmentInProgress: false
          }, false, 'completeAssessment')
        },

        loadFromRecord: (record: AssessmentRecord) => {
          // 从历史记录加载评估数据
          set({
            sessionId: record.sessionId,
            currentAssessment: record.assessmentData,
            isAssessmentInProgress: false,
            error: null
          }, false, 'loadFromRecord')
        },

        clearAssessment: () => {
          set({
            sessionId: null,
            currentTestIndex: 0,
            scores: {},
            bilateralScores: {},
            hasPainfulTests: [],
            asymmetryIssues: {},
            currentAssessment: null,
            isAssessmentInProgress: false,
            error: null
          }, false, 'clearAssessment')
        },

        forceResetAssessment: () => {
          // 强制重置，并清除本地缓存
          set({
            sessionId: null,
            currentTestIndex: 0,
            scores: {},
            bilateralScores: {},
            hasPainfulTests: [],
            asymmetryIssues: {},
            currentAssessment: null,
            isAssessmentInProgress: false,
            error: null
          }, false, 'forceResetAssessment')
          
          // 安全地清除localStorage中的缓存
          try {
            if (typeof Storage !== 'undefined' && localStorage) {
              localStorage.removeItem('fms-assessment-store')
            }
          } catch (error) {
            if (error instanceof Error) {
              if (error.name === 'SecurityError') {
                console.warn('私密浏览模式下localStorage受限')
              } else {
                console.warn('清除localStorage失败:', error.message)
              }
            } else {
              console.warn('清除localStorage失败:', error)
            }
          }
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'setLoading')
        },

        setError: (error: string | null) => {
          set({ error }, false, 'setError')
        },

        // 便利方法
        getTotalScore: () => {
          const state = get()
          // 只计算 scores 中的分数即可，因为双侧测试的最终分数已经在 scores 中
          return Object.values(state.scores).reduce((sum, score) => sum + score, 0)
        },

        hasCompletedAllTests: () => {
          const state = get()
          // 7个基础测试 + 3个排除测试 = 10个测试
          const totalTests = 10
          return Object.keys(state.scores).length >= totalTests
        },

        getCurrentTestCompletion: () => {
          const state = get()
          // 动态获取测试总数，避免硬编码
          const totalTests = 10 // 7个基础测试 + 3个排除测试
          const completedTests = Object.keys(state.scores).length
          return Math.round((completedTests / totalTests) * 100)
        }
      }),
      {
        name: 'fms-assessment-store',
        // 只持久化重要的评估数据，不持久化UI状态
        partialize: (state) => ({
          sessionId: state.sessionId,
          currentTestIndex: state.currentTestIndex,
          scores: state.scores,
          bilateralScores: state.bilateralScores,
          hasPainfulTests: state.hasPainfulTests,
          asymmetryIssues: state.asymmetryIssues,
          currentAssessment: state.currentAssessment,
          isAssessmentInProgress: state.isAssessmentInProgress
        })
      }
    ),
    {
      name: 'fms-assessment-store'
    }
  )
) 