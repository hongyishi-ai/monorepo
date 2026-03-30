import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"
import { Eye, Play, List, Target, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "./badge"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./drawer"

// 测试ID到GIF文件名的映射
const TEST_DEMO_MAPPING: Record<string, string> = {
  'deep-squat': 'DS.gif',
  'hurdle-step': 'HS.gif',
  'inline-lunge': 'ILL.gif',  // 修正：inline-lunge 而不是 in-line-lunge
  'shoulder-mobility': 'SM.gif',
  'trunk-stability-push-up': 'TSPU.gif',
  'active-straight-leg-raise': 'ASLP.gif',  // 修正：文件名是ASLP不是ASLR
  'rotary-stability': 'RS.gif',
  'shoulder-impingement-clearance': 'SIC.gif',
  'spinal-flexion-clearance': 'SFC.gif',
  'spinal-extension-clearance': 'SEC.gif'
};

interface DemoFloatingButtonProps {
  test: any
  className?: string
}

export const DemoFloatingButton = React.forwardRef<HTMLDivElement, DemoFloatingButtonProps>(
  ({ test, className, ...props }, ref) => {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<'demo' | 'steps' | 'scoring'>('demo')
    const [isScrollingDown, setIsScrollingDown] = React.useState(false)
    const [lastScrollY, setLastScrollY] = React.useState(0)
    const [imageError, setImageError] = React.useState(false)
    
    const isClearanceTest = test.isClearanceTest

    // 滚动监听逻辑 - 与smart-status-indicator保持一致
    React.useEffect(() => {
      let ticking = false

      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScrollY = window.scrollY
            
            // 判断滚动方向
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
              // 向下滚动且滚动距离大于150px时半透明显示
              setIsScrollingDown(true)
              if (isDrawerOpen) {
                setIsDrawerOpen(false) // 滚动时自动关闭抽屉
              }
            } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
              // 向上滚动或回到顶部时完全显示
              setIsScrollingDown(false)
            }
            
            setLastScrollY(currentScrollY)
            ticking = false
          })
          ticking = true
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY, isDrawerOpen])

    // 键盘快捷键支持 - 与smart-status-indicator保持一致
    React.useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
        // Alt + D 切换演示指引
        if (e.altKey && e.key === 'd') {
          e.preventDefault()
          setIsDrawerOpen(!isDrawerOpen)
        }
        // Escape 关闭展开的面板
        if (e.key === 'Escape' && isDrawerOpen) {
          setIsDrawerOpen(false)
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isDrawerOpen])

    // 重置图片加载错误状态
    React.useEffect(() => {
      if (isDrawerOpen) {
        setImageError(false)
      }
    }, [isDrawerOpen])

    // 广播抽屉开关状态，供其他悬浮组件降噪处理
    React.useEffect(() => {
      const event = new CustomEvent('demoDrawerToggle', { detail: isDrawerOpen })
      window.dispatchEvent(event)
    }, [isDrawerOpen])

    return (
      <>
        <div
          className="fixed left-6 z-40 md:hidden"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: isScrollingDown ? 0.3 : 1, 
                scale: isScrollingDown ? 0.9 : 1, 
                y: isScrollingDown ? 10 : 0 
              }}
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
                className={cn(
                  "brooklyn-card bg-card/95 backdrop-blur-md border shadow-lg hover:shadow-xl cursor-pointer overflow-hidden",
                  "active:scale-95 touch-manipulation smart-status-transition",
                  isScrollingDown && "indicator-dimmed",
                  !isScrollingDown && "indicator-focused",
                  isClearanceTest && "smart-indicator-border-glow"
                )}
                onClick={() => setIsDrawerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsDrawerOpen(true)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`演示指引 - 点击查看详情`}
                aria-expanded={isDrawerOpen}
              >
                <CardContent className="p-0">
                  {/* 始终显示收缩状态的指示器 - 与smart-status-indicator布局一致 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* 动态状态图标 */}
                      <div className={cn(
                        "relative",
                        isClearanceTest && "smart-indicator-glow"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          isClearanceTest 
                            ? "bg-amber-50 border-amber-200" 
                            : "bg-blue-50 border-blue-200"
                        )}>
                          <Eye className={cn(
                            "w-4 h-4",
                            isClearanceTest ? "text-amber-600" : "text-blue-600"
                          )} />
                        </div>
                        
                        {/* 进度环占位 - 保持与smart-status-indicator一致的布局 */}
                        <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="hsl(var(--border))"
                            strokeWidth="1.5"
                            opacity="0.2"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke={isClearanceTest ? "hsl(43 96% 56%)" : "hsl(217 91% 60%)"}
                            strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 18}`}
                            strokeDashoffset={`${2 * Math.PI * 18 * 0.3}`} // 显示70%的环
                            className="transition-all duration-700 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* 动态指示点 */}
                        <div className={cn(
                          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card",
                          isClearanceTest ? "bg-amber-500" : "bg-blue-500"
                        )}>
                          <div className={cn(
                            "w-full h-full rounded-full animate-ping opacity-75",
                            isClearanceTest ? "bg-amber-400" : "bg-blue-400"
                          )} />
                        </div>
                      </div>

                      {/* 核心信息 */}
                      <div className="text-left min-w-0">
                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                          <span>演示指引</span>
                          <ChevronUp className="w-3 h-3 text-muted-foreground opacity-50" />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {isClearanceTest ? '排除测试指导' : '动作演示说明'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 抽屉组件 */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="max-h-[85vh] brooklyn-card">
            <DrawerHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-primary" />
                {isClearanceTest && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    安全第一
                  </Badge>
                )}
              </div>
              <DrawerTitle className="text-lg font-medium">
                {test.name.split(' (')[0]} - 动作指引
              </DrawerTitle>
              <DrawerDescription className="brooklyn-text">
                {isClearanceTest ? '排除测试详细指导' : '标准动作演示与评分说明'}
              </DrawerDescription>
            </DrawerHeader>

            {/* 标签切换器 */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-1 p-1 bg-secondary/30 rounded-lg">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                    activeTab === 'demo'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Play className="w-3 h-3 mr-1.5 inline" />
                  动作演示
                </button>
                <button
                  onClick={() => setActiveTab('steps')}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                    activeTab === 'steps'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3 h-3 mr-1.5 inline" />
                  执行步骤
                </button>
                <button
                  onClick={() => setActiveTab('scoring')}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all",
                    activeTab === 'scoring'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Target className="w-3 h-3 mr-1.5 inline" />
                  评分标准
                </button>
              </div>
            </div>

            {/* 固定高度的内容区域 */}
            <div className="px-4 pb-6 h-80 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'demo' && (
                  <motion.div
                    key="demo"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* 动作演示区域 */}
                    <div className={cn(
                      "aspect-video rounded-lg border overflow-hidden",
                      isClearanceTest ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                    )}>
                      {TEST_DEMO_MAPPING[test.id] && !imageError ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={`/demo/${TEST_DEMO_MAPPING[test.id]}`}
                            alt={`${test.name} 动作演示`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImageError(true)}
                          />
                          {/* 播放控制提示 */}
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            GIF演示
                          </div>
                        </div>
                      ) : (
                        // 没有对应GIF时的占位符
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            {isClearanceTest ? (
                              <>
                                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h5 className="text-sm font-medium text-amber-700 mb-1">排除测试演示</h5>
                                <p className="text-xs text-amber-600">安全第一，仔细观察</p>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                                <h5 className="text-sm font-medium text-blue-700 mb-1">标准动作演示</h5>
                                <p className="text-xs text-blue-600">标准动作模式展示</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 演示要点 */}
                    <div className="space-y-3">
                      <h6 className="text-sm font-medium text-foreground">观察要点：</h6>
                      <div className="text-xs text-muted-foreground space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>观察标准动作姿态</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>注意关键部位位置</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>识别常见代偿模式</span>
                        </div>
                        {isClearanceTest && (
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                            <span className="text-amber-600 font-medium">如有疼痛立即停止</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'steps' && (
                  <motion.div
                    key="steps"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* 执行步骤 */}
                    <div className="space-y-3">
                      <h6 className="text-sm font-medium text-foreground">执行步骤：</h6>
                      <div className="space-y-3">
                        {test.instructions.map((step: string, index: number) => (
                          <div key={index} className="flex gap-3 text-sm">
                            <div className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              isClearanceTest 
                                ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                : "bg-primary/10 text-primary border border-primary/20"
                            )}>
                              {index + 1}
                            </div>
                            <p className="text-foreground leading-relaxed flex-1">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 安全提示 */}
                    {isClearanceTest && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h6 className="text-sm font-medium text-amber-800 mb-2">重要提示</h6>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              如出现疼痛请立即停止，并咨询医疗专家。此测试用于排除病理性问题。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'scoring' && (
                  <motion.div
                    key="scoring"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* 评分标准 */}
                    <div className="space-y-3">
                      <h6 className="text-sm font-medium text-foreground">评分标准：</h6>
                      <div className="space-y-3">
                        {test.scoringCriteria.map((criteria: any) => (
                          <div key={criteria.score} className="flex gap-3">
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              criteria.score === 0 
                                ? "bg-red-100 text-red-700 border-2 border-red-200"
                                : criteria.score === 1
                                ? "bg-orange-100 text-orange-700 border-2 border-orange-200"
                                : criteria.score === 2
                                ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                                : "bg-green-100 text-green-700 border-2 border-green-200"
                            )}>
                              {criteria.score}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground leading-relaxed">
                                {criteria.criteria}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部提示 */}
            <div className="text-center p-4 bg-muted/20 rounded-lg border mx-4 mb-4">
              <div className="brooklyn-text text-sm space-y-2">
                <div>向下滑动或点击外部区域可关闭</div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">Alt</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">D</kbd>
                  <span className="ml-1">快速切换</span>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }
)

DemoFloatingButton.displayName = "DemoFloatingButton" 
