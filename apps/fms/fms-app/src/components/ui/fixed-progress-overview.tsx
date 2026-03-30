import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"
import { CheckCircle, Activity, AlertTriangle } from "lucide-react"

interface FixedProgressOverviewProps {
  completedBasicTests: number
  totalBasicTests: number
  completedClearanceTests: number
  totalClearanceTests: number
  asymmetryCount: number
  painfulCount: number
  currentTestName?: string
  currentTestType?: 'basic' | 'clearance'
  className?: string
}

export const FixedProgressOverview = React.forwardRef<HTMLDivElement, FixedProgressOverviewProps>(
  ({ 
    completedBasicTests, 
    totalBasicTests, 
    completedClearanceTests, 
    totalClearanceTests, 
    asymmetryCount, 
    painfulCount,
    currentTestName,
    currentTestType,
    className,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [isExpanded, setIsExpanded] = React.useState(false)

    // 总进度计算
    const totalCompleted = completedBasicTests + completedClearanceTests
    const totalTests = totalBasicTests + totalClearanceTests
    const progressPercentage = Math.round((totalCompleted / totalTests) * 100)

    // 自动隐藏逻辑：如果没有任何完成的测试，隐藏组件
    React.useEffect(() => {
      setIsVisible(totalCompleted > 0)
    }, [totalCompleted])

    if (!isVisible) return null

    return (
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence mode="wait">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className={cn("", className)}
            {...props}
          >
            <Card 
              className="brooklyn-card bg-card/95 backdrop-blur-md border shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
              role="status"
              aria-live="polite"
              aria-label={`测试进度：已完成 ${totalCompleted} / ${totalTests}，完成度 ${progressPercentage}%${currentTestName ? `，当前测试：${currentTestName}` : ''}`}
            >
              <CardContent className="p-4">
                <AnimatePresence mode="wait">
                  {!isExpanded ? (
                    // 收缩状态：只显示核心指标
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      {/* 进度指示器 */}
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        {/* 环形进度条 */}
                        <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="hsl(var(--secondary))"
                            strokeWidth="2"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 18}`}
                            strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPercentage / 100)}`}
                            className="transition-all duration-300"
                          />
                        </svg>
                      </div>

                      {/* 核心数据 */}
                      <div className="text-left">
                        <div className="text-sm font-medium text-foreground">
                          {totalCompleted}/{totalTests}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progressPercentage}% 完成
                        </div>
                      </div>

                      {/* 警告指示器 */}
                      {(asymmetryCount > 0 || painfulCount > 0) && (
                        <div className="flex flex-col gap-1">
                          {asymmetryCount > 0 && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                          {painfulCount > 0 && (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    // 展开状态：显示详细信息
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 min-w-[200px]"
                    >
                      {/* 标题 */}
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-foreground mb-1">测试进度</h4>
                        <div className="text-xs text-muted-foreground">
                          整体完成度 {progressPercentage}%
                        </div>
                      </div>

                      {/* 当前测试提示 */}
                      {currentTestName && (
                        <div className="text-center py-2 px-3 bg-primary/5 rounded border border-primary/10">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            {currentTestType === 'clearance' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-3 h-3 text-primary" />
                            )}
                            <span className="text-xs font-medium text-foreground">当前测试</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {currentTestName}
                          </div>
                        </div>
                      )}

                      {/* 详细统计 */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* 基础测试 */}
                        <div className="text-center">
                          <div className="text-lg font-light text-primary">
                            {completedBasicTests}
                          </div>
                          <div className="text-xs brooklyn-text">基础测试</div>
                          <div className="text-xs text-muted-foreground/70">
                            /{totalBasicTests}
                          </div>
                        </div>

                        {/* 排除测试 */}
                        <div className="text-center">
                          <div className="text-lg font-light text-amber-600">
                            {completedClearanceTests}
                          </div>
                          <div className="text-xs brooklyn-text">排除测试</div>
                          <div className="text-xs text-muted-foreground/70">
                            /{totalClearanceTests}
                          </div>
                        </div>

                        {/* 不对称项 */}
                        {asymmetryCount > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-light text-blue-600">
                              {asymmetryCount}
                            </div>
                            <div className="text-xs brooklyn-text">不对称项</div>
                          </div>
                        )}

                        {/* 疼痛项 */}
                        {painfulCount > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-light text-red-500">
                              {painfulCount}
                            </div>
                            <div className="text-xs brooklyn-text">疼痛项</div>
                          </div>
                        )}
                      </div>

                      {/* 底部提示 */}
                      <div className="text-center pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground/70">
                          点击可收起
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }
)

FixedProgressOverview.displayName = "FixedProgressOverview" 