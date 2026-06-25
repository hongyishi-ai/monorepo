import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronRight,
  Zap,
  Eye,
  Target,
  BarChart3,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./drawer";

interface SmartStatusIndicatorProps {
  completedBasicTests: number;
  totalBasicTests: number;
  completedClearanceTests: number;
  totalClearanceTests: number;
  asymmetryCount: number;
  painfulCount: number;
  currentTestName?: string;
  currentTestType?: "basic" | "clearance";
  requiresBilateralAssessment?: boolean;
  className?: string;
}

export const SmartStatusIndicator = React.forwardRef<
  HTMLDivElement,
  SmartStatusIndicatorProps
>(
  (
    {
      completedBasicTests,
      totalBasicTests,
      completedClearanceTests,
      totalClearanceTests,
      asymmetryCount,
      painfulCount,
      currentTestName,
      currentTestType,
      requiresBilateralAssessment,
      className,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [isScrollingDown, setIsScrollingDown] = React.useState(false);
    const [lastScrollY, setLastScrollY] = React.useState(0);
    const [isDemoDrawerOpen, setIsDemoDrawerOpen] = React.useState(false);

    // 总进度计算
    const totalCompleted = completedBasicTests + completedClearanceTests;
    const totalTests = totalBasicTests + totalClearanceTests;
    const progressPercentage = Math.round((totalCompleted / totalTests) * 100);

    // 滚动监听逻辑
    React.useEffect(() => {
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;

            // 判断滚动方向
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
              // 向下滚动且滚动距离大于150px时半透明显示
              setIsScrollingDown(true);
              if (isDrawerOpen) {
                setIsDrawerOpen(false); // 滚动时自动关闭抽屉
              }
            } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
              // 向上滚动或回到顶部时完全显示
              setIsScrollingDown(false);
            }

            setLastScrollY(currentScrollY);
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY, isDrawerOpen]);

    // 键盘快捷键支持
    React.useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
        // Alt + S 切换状态指示器
        if (e.altKey && e.key === "s") {
          e.preventDefault();
          setIsDrawerOpen(!isDrawerOpen);
        }
        // Escape 关闭展开的面板
        if (e.key === "Escape" && isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }, [isDrawerOpen]);

    // 监听演示指引抽屉开关，打开时弱化本指示器，避免双悬浮抢占注意力
    React.useEffect(() => {
      const handleDemoToggle = (e: Event) => {
        try {
          const custom = e as CustomEvent<boolean>;
          setIsDemoDrawerOpen(!!custom.detail);
        } catch {
          // ignore
        }
      };
      window.addEventListener(
        "demoDrawerToggle",
        handleDemoToggle as EventListener,
      );
      return () =>
        window.removeEventListener(
          "demoDrawerToggle",
          handleDemoToggle as EventListener,
        );
    }, []);

    // 自动隐藏逻辑：如果没有任何完成的测试，隐藏组件
    React.useEffect(() => {
      setIsVisible(totalCompleted > 0);
    }, [totalCompleted]);

    // 动态图标选择
    const getStatusIcon = () => {
      if (requiresBilateralAssessment) {
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      }
      if (currentTestType === "clearance") {
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      }
      if (asymmetryCount > 0 || painfulCount > 0) {
        return <Zap className="w-4 h-4 text-red-500" />;
      }
      return <Target className="w-4 h-4 text-primary" />;
    };

    // 状态描述
    const getStatusText = () => {
      if (requiresBilateralAssessment) {
        return "双侧评估";
      }
      if (currentTestType === "clearance") {
        return "排除测试";
      }
      if (asymmetryCount > 0 || painfulCount > 0) {
        return "需要关注";
      }
      return "进行中";
    };

    if (!isVisible) return null;

    return (
      <>
        <div
          className="z-10 mb-4 lg:fixed lg:right-6 lg:bottom-6 lg:z-50 lg:mb-0"
          data-hys-assist-control="status"
        >
          <AnimatePresence mode="wait">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity: isScrollingDown ? 0.82 : 1,
                scale: isScrollingDown ? 0.98 : 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
              className={cn("", className)}
              {...props}
            >
              <Card
                className={cn(
                  "hys-mobile-assist-card hys-assist-card hys-assist-card--status cursor-pointer overflow-hidden bg-card/95 backdrop-blur-md md:h-auto md:w-[18rem]",
                  "active:scale-95 touch-manipulation smart-status-transition",
                  isScrollingDown && "indicator-dimmed",
                  !isScrollingDown && "indicator-focused",
                  (requiresBilateralAssessment ||
                    asymmetryCount > 0 ||
                    painfulCount > 0) &&
                    "hys-assist-card--attention",
                  isDemoDrawerOpen && "opacity-40 pointer-events-none",
                )}
                onClick={() => setIsDrawerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsDrawerOpen(true);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`测试状态指示器 - 点击查看详情`}
                aria-expanded={isDrawerOpen}
              >
                <CardContent className="p-0">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hys-assist-card__inner"
                  >
                    <div className="hys-assist-card__icon" aria-hidden="true">
                      {getStatusIcon()}
                    </div>

                    <div className="hys-assist-card__body">
                      <div className="hys-assist-card__title-row">
                        <span className="hys-assist-card__title">测试状态</span>
                        <span className="hys-assist-card__count">
                          {totalCompleted}/{totalTests}
                        </span>
                      </div>
                      <div className="hys-assist-card__meta">
                        {getStatusText()}
                        {currentTestName ? ` · ${currentTestName}` : ""}
                      </div>
                    </div>

                    <div
                      className="hys-assist-card__meter"
                      aria-hidden="true"
                      style={
                        {
                          "--hys-assist-progress": `${progressPercentage}%`,
                        } as React.CSSProperties
                      }
                    />

                    <ChevronRight
                      className="hys-assist-card__chevron"
                      aria-hidden="true"
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 抽屉组件 - 从底部弹出 */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="hys-drawer-content hys-card">
            <DrawerHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <DrawerTitle className="text-lg font-normal">
                  FMS测试状态详情
                </DrawerTitle>
              </div>
              <DrawerDescription className="hys-text">
                当前评估进度：{progressPercentage}% ({totalCompleted}/
                {totalTests})
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-6 pb-8">
              {/* 当前测试状态 */}
              {currentTestName && (
                <div className="hys-card mb-6 p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {requiresBilateralAssessment ? (
                        <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                      ) : currentTestType === "clearance" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-primary" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        当前测试
                      </span>
                    </div>
                    <div className="text-base hys-text mb-2">
                      {currentTestName}
                    </div>
                    {requiresBilateralAssessment && (
                      <div className="text-sm text-blue-600 font-medium">
                        需要双侧对比评估
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 统计信息网格 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 基础测试 */}
                <div className="hys-panel p-4 text-center">
                  <div className="text-2xl font-light text-primary mb-2">
                    {completedBasicTests}
                  </div>
                  <div className="text-sm hys-text mb-1">基础测试</div>
                  <div className="text-xs text-muted-foreground">
                    共 {totalBasicTests} 项
                  </div>
                </div>

                {/* 排除测试 */}
                <div className="hys-panel p-4 text-center">
                  <div className="text-2xl font-light text-amber-600 mb-2">
                    {completedClearanceTests}
                  </div>
                  <div className="text-sm hys-text mb-1">排除测试</div>
                  <div className="text-xs text-muted-foreground">
                    共 {totalClearanceTests} 项
                  </div>
                </div>
              </div>

              {/* 警告信息 */}
              {(asymmetryCount > 0 || painfulCount > 0) && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {asymmetryCount > 0 && (
                    <div className="hys-panel p-4 text-center">
                      <div className="text-2xl font-light text-blue-600 mb-2">
                        {asymmetryCount}
                      </div>
                      <div className="text-sm hys-text">不对称项</div>
                    </div>
                  )}

                  {painfulCount > 0 && (
                    <div className="hys-panel p-4 text-center">
                      <div className="text-2xl font-light text-red-500 mb-2">
                        {painfulCount}
                      </div>
                      <div className="text-sm hys-text">疼痛项</div>
                    </div>
                  )}
                </div>
              )}

              {/* 底部提示 */}
              <div className="border-2 border-border bg-muted/20 p-4 text-center">
                <div className="hys-text text-sm space-y-2">
                  <div>向下滑动或点击外部区域可关闭</div>
                  <div className="hidden items-center justify-center gap-2 text-xs sm:flex">
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                      Alt
                    </kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                      S
                    </kbd>
                    <span className="ml-1">快速切换</span>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  },
);

SmartStatusIndicator.displayName = "SmartStatusIndicator";
