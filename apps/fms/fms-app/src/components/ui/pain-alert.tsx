import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertTitle, AlertDescription } from "./alert"
import { cn } from "@/lib/utils"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "./button"

interface PainAlertProps {
  isVisible: boolean
  testName: string
  painSide: 'left' | 'right' | 'bilateral'
  onDismiss?: () => void
  autoHideDuration?: number
}

export const PainAlert = React.forwardRef<HTMLDivElement, PainAlertProps>(
  ({ 
    isVisible, 
    testName, 
    painSide,
    onDismiss,
    autoHideDuration = 8000,
    ...props 
  }, ref) => {
    const [shouldShow, setShouldShow] = React.useState(false)

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

    // 获取疼痛侧别描述
    const getPainDescription = () => {
      switch (painSide) {
        case 'bilateral':
          return '双侧检测到疼痛反应'
        case 'left':
          return '左侧检测到疼痛反应'
        case 'right':
          return '右侧检测到疼痛反应'
        default:
          return '检测到疼痛反应'
      }
    }

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
              variant="destructive"
              className={cn(
                "border-2 shadow-xl backdrop-blur-md relative overflow-hidden",
                "bg-red-50/90 border-red-300",
                "pain-alert-glow"
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
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </motion.div>

              {/* 内容区域 */}
              <div className="pl-7">
                <AlertTitle className="text-sm font-semibold mb-2 text-red-600">
                  检测到疼痛
                </AlertTitle>
                
                <AlertDescription className="text-xs leading-relaxed pr-8 text-red-800">
                  {getPainDescription()}。建议立即停止相关动作测试，并寻求专业医疗评估。
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
                      className="h-full rounded-full bg-red-400"
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

PainAlert.displayName = "PainAlert" 