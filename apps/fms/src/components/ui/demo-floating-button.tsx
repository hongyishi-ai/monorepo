import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Eye,
  Play,
  List,
  Target,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Badge } from "./badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./drawer";

// 测试ID到GIF文件名的映射
const TEST_DEMO_MAPPING: Record<string, string> = {
  "deep-squat": "DS.gif",
  "hurdle-step": "HS.gif",
  "inline-lunge": "ILL.gif", // 修正：inline-lunge 而不是 in-line-lunge
  "shoulder-mobility": "SM.gif",
  "trunk-stability-push-up": "TSPU.gif",
  "active-straight-leg-raise": "ASLP.gif", // 修正：文件名是ASLP不是ASLR
  "rotary-stability": "RS.gif",
  "shoulder-impingement-clearance": "SIC.gif",
  "spinal-flexion-clearance": "SFC.gif",
  "spinal-extension-clearance": "SEC.gif",
};

const demoAssetUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}demo/${fileName}`;

interface DemoFloatingButtonProps {
  test: any;
  className?: string;
}

export const DemoFloatingButton = React.forwardRef<
  HTMLDivElement,
  DemoFloatingButtonProps
>(({ test, className, ...props }, ref) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "demo" | "steps" | "scoring"
  >("demo");
  const [imageError, setImageError] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isClearanceTest = test.isClearanceTest;

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "d") {
        e.preventDefault();
        setIsDrawerOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // 重置图片加载错误状态
  React.useEffect(() => {
    if (isDrawerOpen) {
      setImageError(false);
    }
  }, [isDrawerOpen]);

  // 广播抽屉开关状态，供其他悬浮组件降噪处理
  React.useEffect(() => {
    const event = new CustomEvent("demoDrawerToggle", { detail: isDrawerOpen });
    window.dispatchEvent(event);
  }, [isDrawerOpen]);

  return (
    <>
      <div className="md:hidden" data-hys-assist-control="demo">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={test.id}
            ref={ref}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: "easeOut",
            }}
            className={className}
            {...props}
          >
            <button
              className="flex min-h-12 w-full touch-manipulation items-center gap-3 rounded border-2 border-border bg-background px-3 py-2.5 text-left font-bold text-foreground transition-[transform,background-color,color] duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none"
              onClick={() => setIsDrawerOpen(true)}
              type="button"
              aria-label={`查看${test.name.split(" (")[0]}的动作演示、执行步骤和评分标准`}
              aria-expanded={isDrawerOpen}
            >
              <span
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded bg-primary text-primary-foreground"
                aria-hidden="true"
              >
                <Play className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">查看动作演示</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  GIF、执行步骤与评分标准
                </span>
              </span>
              {isClearanceTest && (
                <Badge variant="outline" className="shrink-0">
                  安全
                </Badge>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 抽屉组件 */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        shouldScaleBackground={false}
      >
        <DrawerContent className="hys-drawer-content hys-card max-h-[min(85vh,calc(100vh-var(--hys-mobile-nav-height)-1rem))]">
          <DrawerHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-primary" />
              {isClearanceTest && (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                >
                  安全第一
                </Badge>
              )}
            </div>
            <DrawerTitle className="text-lg font-medium">
              {test.name.split(" (")[0]} - 动作指引
            </DrawerTitle>
            <DrawerDescription className="hys-text">
              {isClearanceTest ? "排除测试详细指导" : "标准动作演示与评分说明"}
            </DrawerDescription>
          </DrawerHeader>

          {/* 标签切换器 */}
          <div className="px-4 pb-4">
            <div
              className="flex items-center gap-1 border-2 border-border bg-secondary/20 p-1"
              role="tablist"
              aria-label="动作指引内容"
            >
              <button
                onClick={() => setActiveTab("demo")}
                className={cn(
                  "min-h-11 flex-1 border-2 border-transparent px-2 py-2 text-xs font-bold transition-colors",
                  activeTab === "demo"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                role="tab"
                aria-selected={activeTab === "demo"}
                type="button"
              >
                <Play className="w-3 h-3 mr-1.5 inline" />
                动作演示
              </button>
              <button
                onClick={() => setActiveTab("steps")}
                className={cn(
                  "min-h-11 flex-1 border-2 border-transparent px-2 py-2 text-xs font-bold transition-colors",
                  activeTab === "steps"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                role="tab"
                aria-selected={activeTab === "steps"}
                type="button"
              >
                <List className="w-3 h-3 mr-1.5 inline" />
                执行步骤
              </button>
              <button
                onClick={() => setActiveTab("scoring")}
                className={cn(
                  "min-h-11 flex-1 border-2 border-transparent px-2 py-2 text-xs font-bold transition-colors",
                  activeTab === "scoring"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                role="tab"
                aria-selected={activeTab === "scoring"}
                type="button"
              >
                <Target className="w-3 h-3 mr-1.5 inline" />
                评分标准
              </button>
            </div>
          </div>

          {/* 固定高度的内容区域 */}
          <div className="h-80 overflow-y-auto px-4 pb-6">
            <AnimatePresence mode="wait">
              {activeTab === "demo" && (
                <motion.div
                  key="demo"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.18,
                    ease: "easeOut",
                  }}
                  className="space-y-4"
                  role="tabpanel"
                >
                  {/* 动作演示区域 */}
                  <div
                    className={cn(
                      "aspect-video border-2 overflow-hidden",
                      isClearanceTest
                        ? "bg-amber-50 border-amber-300"
                        : "bg-primary/10 border-primary/30",
                    )}
                  >
                    {TEST_DEMO_MAPPING[test.id] && !imageError ? (
                      <div className="w-full h-full relative">
                        <img
                          src={demoAssetUrl(TEST_DEMO_MAPPING[test.id])}
                          alt={`${test.name} 动作演示`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={() => setImageError(true)}
                        />
                        {/* 播放控制提示 */}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          GIF 演示
                        </div>
                      </div>
                    ) : (
                      // 没有对应GIF时的占位符
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          {isClearanceTest ? (
                            <>
                              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                              <h5 className="text-sm font-medium text-amber-700 mb-1">
                                排除测试演示
                              </h5>
                              <p className="text-xs text-amber-600">
                                安全第一，仔细观察
                              </p>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                              <h5 className="text-sm font-medium text-blue-700 mb-1">
                                标准动作演示
                              </h5>
                              <p className="text-xs text-blue-600">
                                标准动作模式展示
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 演示要点 */}
                  <div className="space-y-3">
                    <h6 className="text-sm font-medium text-foreground">
                      观察要点：
                    </h6>
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
                          <span className="text-amber-600 font-medium">
                            如有疼痛立即停止
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "steps" && (
                <motion.div
                  key="steps"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.18,
                    ease: "easeOut",
                  }}
                  className="space-y-4"
                  role="tabpanel"
                >
                  {/* 执行步骤 */}
                  <div className="space-y-3">
                    <h6 className="text-sm font-medium text-foreground">
                      执行步骤：
                    </h6>
                    <div className="space-y-3">
                      {test.instructions.map((step: string, index: number) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <div
                            className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              isClearanceTest
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-primary/10 text-primary border border-primary/20",
                            )}
                          >
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
                    <div className="hys-inline-alert p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h6 className="text-sm font-medium text-amber-800 mb-2">
                            重要提示
                          </h6>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            如出现疼痛请立即停止，并咨询医疗专家。此测试用于排除病理性问题。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "scoring" && (
                <motion.div
                  key="scoring"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.18,
                    ease: "easeOut",
                  }}
                  className="space-y-4"
                  role="tabpanel"
                >
                  {/* 评分标准 */}
                  <div className="space-y-3">
                    <h6 className="text-sm font-medium text-foreground">
                      评分标准：
                    </h6>
                    <div className="space-y-3">
                      {test.scoringCriteria.map((criteria: any) => (
                        <div key={criteria.score} className="flex gap-3">
                          <div
                            className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              criteria.score === 0
                                ? "bg-red-100 text-red-700 border-2 border-red-200"
                                : criteria.score === 1
                                  ? "bg-orange-100 text-orange-700 border-2 border-orange-200"
                                  : criteria.score === 2
                                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                                    : "bg-green-100 text-green-700 border-2 border-green-200",
                            )}
                          >
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
          <div className="mx-4 mb-4 border-2 border-border bg-muted/20 p-4 text-center">
            <div className="hys-text text-sm space-y-2">
              <div>向下滑动或点击外部区域可关闭</div>
              <div className="hidden items-center justify-center gap-2 text-xs sm:flex">
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                  Alt
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                  D
                </kbd>
                <span className="ml-1">快速切换</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
});

DemoFloatingButton.displayName = "DemoFloatingButton";
