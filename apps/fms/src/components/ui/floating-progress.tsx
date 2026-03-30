import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "./progress"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import { Activity, ChevronRight } from "lucide-react"

interface FloatingProgressProps {
  value: number
  max: number
  label?: string
  className?: string
  currentStep?: string
  stepInfo?: string
}

export const FloatingProgress = React.forwardRef<HTMLDivElement, FloatingProgressProps>(
  ({ value, max, label, className, currentStep, stepInfo, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [lastScrollY, setLastScrollY] = React.useState(0)
    const scrollTimeoutRef = React.useRef<number | null>(null)

    React.useEffect(() => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY
        
        // 只有在实际滚动时才隐藏
        if (Math.abs(currentScrollY - lastScrollY) > 3) {
          setIsVisible(false)
          
          // 清除之前的定时器
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }
          
          // 停止滚动后重新显示
          scrollTimeoutRef.current = window.setTimeout(() => {
            setIsVisible(true)
          }, 200)
        }
        
        setLastScrollY(currentScrollY)
      }

      // 使用防抖处理，而不是节流
      let timeoutId: number | null = null
      const debouncedHandleScroll = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        handleScroll()
        
        timeoutId = window.setTimeout(() => {
          setIsVisible(true)
        }, 150)
      }

      window.addEventListener('scroll', debouncedHandleScroll, { passive: true })
      
      return () => {
        window.removeEventListener('scroll', debouncedHandleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [lastScrollY])

    const percentage = Math.round((value / max) * 100)

    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.8
              }}
              className={cn("w-full max-w-md mx-4", className)}
              {...props}
            >
              <Card className="shadow-2xl shadow-black/10 border bg-card/95 backdrop-blur-md ring-1 ring-border/5">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 顶部标题行 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Activity className="h-5 w-5 text-primary" />
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-primary/20"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            FMS 功能性动作筛查
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            专业评估进行中
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-sm">
                        {value}/{max}
                      </Badge>
                    </div>
                    
                    {/* 进度条区域 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">完成进度</span>
                        <span className="font-semibold text-primary">{percentage}%</span>
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-3 bg-secondary/50"
                        aria-label={`FMS评估进度：${percentage}%，已完成${value}项，共${max}项`}
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          已完成 {value} 项
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          剩余 {max - value} 项
                        </span>
                      </div>
                    </div>
                    
                    {/* 当前步骤信息 */}
                    {currentStep && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="border-t pt-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            当前测试
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-foreground">
                            {currentStep}
                          </div>
                          {stepInfo && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                              {stepInfo}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

FloatingProgress.displayName = "FloatingProgress" 