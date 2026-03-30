import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertTitle, AlertDescription } from "./alert"
import { cn } from "@/lib/utils"
import { AlertTriangle, TrendingDown, X, ArrowLeftRight } from "lucide-react"
import { Button } from "./button"

interface AsymmetryAlertProps {
  isVisible: boolean
  asymmetryLevel: 'severe' | 'moderate' | 'mild'
  riskLevel: 'high' | 'medium' | 'low'
  testName: string
  leftScore: number
  rightScore: number
  finalScore: number
  recommendations?: string[]
  onDismiss?: () => void
  autoHideDuration?: number // 自动隐藏时长（毫秒）
}

export const AsymmetryAlert = React.forwardRef<HTMLDivElement, AsymmetryAlertProps>(
  ({ 
    isVisible, 
    asymmetryLevel, 
    riskLevel, 
    testName, 
    leftScore,
    rightScore,
    finalScore,
    recommendations = [],
    onDismiss,
    autoHideDuration = 6000,
    ...props 
  }, ref) => {
    const [shouldShow, setShouldShow] = React.useState(false)

    // 安全检查：如果存在疼痛（0分），不显示此Alert
    const hasPain = leftScore === 0 || rightScore === 0;
    if (hasPain) {
      return null; // 疼痛优先级更高，不显示不对称Alert
    }

    // 自动隐藏逻辑
    React.useEffect(() => {
      if (isVisible) {
        setShouldShow(true)
        
        if (autoHideDuration > 0) {
          const timer = setTimeout(() => {
            setShouldShow(false)
            setTimeout(() => {
              onDismiss?.()
            }, 300) // 等待退出动画完成
          }, autoHideDuration)
          
          return () => clearTimeout(timer)
        }
      } else {
        setShouldShow(false)
      }
    }, [isVisible, autoHideDuration, onDismiss])

    // 根据风险等级获取配置
    const getAlertConfig = () => {
      switch (riskLevel) {
        case 'high':
          return {
            variant: 'destructive' as const,
            icon: <AlertTriangle className="h-4 w-4" />,
            bgColor: 'bg-red-50/90',
            borderColor: 'border-red-300',
            title: '严重不对称风险',
            description: `${testName}检测到显著的左右差异。建议立即关注并寻求专业评估。`,
            accentColor: 'text-red-600'
          }
        case 'medium':
          return {
            variant: 'default' as const,
            icon: <TrendingDown className="h-4 w-4 text-amber-600" />,
            bgColor: 'bg-amber-50/90',
            borderColor: 'border-amber-300',
            title: '中度不对称提示',
            description: `${testName}存在一定程度的左右差异，建议加强针对性训练。`,
            accentColor: 'text-amber-600'
          }
        default:
          return {
            variant: 'default' as const,
            icon: <ArrowLeftRight className="h-4 w-4 text-blue-600" />,
            bgColor: 'bg-blue-50/90',
            borderColor: 'border-blue-300',
            title: '轻度不对称提示',
            description: `${testName}检测到轻微的左右差异，请在日常训练中保持关注。`,
            accentColor: 'text-blue-600'
          }
      }
    }

    const config = getAlertConfig()

    return (
      <AnimatePresence mode="wait">
        {shouldShow && (
          <motion.div
            ref={ref}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              y: -20,
              filter: "blur(4px)"
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
              filter: "blur(0px)"
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: -10,
              filter: "blur(2px)"
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className="fixed top-4 md:top-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 md:max-w-md md:w-full"
            {...props}
          >
            <Alert
              variant={config.variant}
              className={cn(
                "border-2 shadow-xl backdrop-blur-md relative overflow-hidden",
                config.bgColor,
                config.borderColor,
                "asymmetry-alert-glow"
              )}
            >
              {/* 动态背景效果 */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  background: [
                    'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                    'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)',
                    'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* 图标区域 */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: 3,
                  ease: "easeInOut"
                }}
                className="absolute left-4 top-4"
              >
                {config.icon}
              </motion.div>

              {/* 内容区域 */}
              <div className="pl-7">
                <AlertTitle className={cn("text-sm font-semibold mb-2", config.accentColor)}>
                  评分完成 - {config.title}
                </AlertTitle>
                
                {/* 简化的评分结果 */}
                <div className="flex items-center gap-4 mb-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600 font-medium">{leftScore}</span>
                    <span className="text-gray-500">左侧</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-base font-bold",
                      config.accentColor
                    )}>
                      {finalScore}
                    </span>
                    <span className="text-gray-500">最终得分</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-medium">{rightScore}</span>
                    <span className="text-gray-500">右侧</span>
                  </div>
                </div>
                
                <AlertDescription className="text-xs leading-relaxed pr-8">
                  {config.description}
                  {recommendations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <span className="font-medium">建议：</span>
                      <span>{recommendations[0]}</span>
                      {recommendations.length > 1 && (
                        <span className="text-gray-500"> 等{recommendations.length}项</span>
                      )}
                    </div>
                  )}
                </AlertDescription>
                
                {/* 进度条指示剩余时间 */}
                {autoHideDuration > 0 && (
                  <motion.div
                    className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        riskLevel === 'high' ? "bg-red-400" :
                        riskLevel === 'medium' ? "bg-amber-400" :
                        "bg-blue-400"
                      )}
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ 
                        duration: autoHideDuration / 1000,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                )}
              </div>

              {/* 关闭按钮 */}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShouldShow(false)
                    setTimeout(() => onDismiss(), 300)
                  }}
                  className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-black/10"
                  aria-label="关闭提醒"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

AsymmetryAlert.displayName = "AsymmetryAlert" 