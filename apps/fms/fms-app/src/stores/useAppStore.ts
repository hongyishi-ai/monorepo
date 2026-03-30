import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 应用全局状态接口
interface AppState {
  // 页面导航状态
  isNavigating: boolean
  lastVisitedPage: string | null
  
  // 跨页面数据传递
  reportData: {
    scores?: Record<string, number>
    bilateralScores?: Record<string, any>
    asymmetryIssues?: Record<string, any>
    painfulTests?: string[]
    basicTests?: string[]
    clearanceTests?: string[]
    sessionId?: string | null
  } | null
  
  // UI状态
  isMobileMenuOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  setNavigating: (isNavigating: boolean) => void
  setLastVisitedPage: (page: string) => void
  setReportData: (data: any) => void
  clearReportData: () => void
  setMobileMenuOpen: (isOpen: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // 便利方法
  hasReportData: () => boolean
  getNavigationContext: () => { from: string | null; hasData: boolean }
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isNavigating: false,
      lastVisitedPage: null,
      reportData: null,
      isMobileMenuOpen: false,
      theme: 'system',

      // Actions
      setNavigating: (isNavigating: boolean) => {
        set({ isNavigating }, false, 'setNavigating')
      },

      setLastVisitedPage: (page: string) => {
        set({ lastVisitedPage: page }, false, 'setLastVisitedPage')
      },

      setReportData: (data: any) => {
        set({ reportData: data }, false, 'setReportData')
      },

      clearReportData: () => {
        set({ reportData: null }, false, 'clearReportData')
      },

      setMobileMenuOpen: (isOpen: boolean) => {
        set({ isMobileMenuOpen: isOpen }, false, 'setMobileMenuOpen')
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme }, false, 'setTheme')
      },

      // 便利方法
      hasReportData: () => {
        const state = get()
        return state.reportData !== null && 
               Object.keys(state.reportData).length > 0
      },

      getNavigationContext: () => {
        const state = get()
        return {
          from: state.lastVisitedPage,
          hasData: state.hasReportData()
        }
      }
    }),
    {
      name: 'fms-app-store'
    }
  )
) 