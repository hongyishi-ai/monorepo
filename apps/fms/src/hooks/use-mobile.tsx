import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // 设置初始状态
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // 添加事件监听器 - 优先使用现代API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
    } else if (typeof mql.addListener === "function") {
      // @ts-ignore - 兼容旧版本浏览器
      mql.addListener(onChange)
    }

    // 清理函数 - 确保正确移除事件监听器
    return () => {
      try {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange)
        } else if (typeof mql.removeListener === "function") {
          // @ts-ignore - 兼容旧版本浏览器
          mql.removeListener(onChange)
        }
      } catch (error) {
        console.warn('Failed to remove media query listener:', error)
      }
    }
  }, [])

  return !!isMobile
}
