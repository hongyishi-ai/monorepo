import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { X, ArrowRight, ArrowLeft, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// 引导步骤的配置接口
export interface TourStep {
  id: string;
  title: string;
  description: string;
  content?: React.ReactNode;
  target?: string; // CSS 选择器
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  highlightColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  disableBeacon?: boolean;
  allowClicksThruHole?: boolean;
}

// 引导配置接口
export interface TourConfig {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  showNavigation?: boolean;
  continuous?: boolean;
  disableOverlay?: boolean;
  disableScrolling?: boolean;
  locale?: {
    back?: string;
    close?: string;
    last?: string;
    next?: string;
    skip?: string;
    of?: string;
  };
}

// 主要的产品引导组件
interface ProductTourProps {
  isOpen: boolean;
  onRequestClose: () => void;
  config: TourConfig;
  className?: string;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  isOpen,
  onRequestClose,
  config,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);

  // 本地化配置
  const locale = {
    back: '上一步',
    close: '关闭',
    last: '完成',
    next: '下一步',
    skip: '跳过引导',
    of: '/',
    ...config.locale
  };

  // 更新窗口尺寸
  const updateWindowSize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // 获取目标元素的位置
  const updateTargetBounds = useCallback(() => {
    const step = config.steps[currentStep];
    if (!step?.target) {
      setTargetBounds(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const bounds = element.getBoundingClientRect();
      setTargetBounds(bounds);

      // 添加平滑滚动到目标元素
      const scrollToTarget = () => {
        const elementTop = window.pageYOffset + bounds.top;
        const elementCenter = elementTop - (window.innerHeight / 2) + (bounds.height / 2);
        
        window.scrollTo({
          top: Math.max(0, elementCenter),
          behavior: 'smooth'
        });
      };

      // 延迟滚动，确保步骤卡片动画完成后再滚动
      setTimeout(scrollToTarget, 300);
    } else {
      setTargetBounds(null);
    }
  }, [currentStep, config.steps]);

  // 监听窗口大小变化和滚动
  useEffect(() => {
    if (!isOpen) return;

    updateWindowSize();
    updateTargetBounds();

    const handleResize = () => {
      updateWindowSize();
      updateTargetBounds();
    };

    const handleScroll = () => {
      updateTargetBounds();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, updateWindowSize, updateTargetBounds]);

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onRequestClose();
          break;
        case 'ArrowRight':
          if (currentStep < config.steps.length - 1) {
            setCurrentStep(currentStep + 1);
          }
          break;
        case 'ArrowLeft':
          if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, config.steps.length, onRequestClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (!isOpen || config.disableScrolling === false) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, config.disableScrolling]);

  // 处理步骤导航
  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      config.onComplete?.();
      onRequestClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    config.onSkip?.();
    onRequestClose();
  };

  // 计算步骤卡片的位置
  const getStepCardPosition = useCallback(() => {
    const step = config.steps[currentStep];
    const padding = 20;
    const isMobile = windowSize.width < 768;
    const cardWidth = isMobile ? Math.min(windowSize.width - 40, 350) : 380;
    const cardHeight = isMobile ? 280 : 300;

    if (!targetBounds || step.placement === 'center') {
      return {
        top: (windowSize.height - cardHeight) / 2,
        left: (windowSize.width - cardWidth) / 2,
        transform: 'none'
      };
    }

    const placement = step.placement || 'bottom';
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetBounds.top - cardHeight - padding;
        left = targetBounds.left + (targetBounds.width - cardWidth) / 2;
        break;
      case 'bottom':
        top = targetBounds.bottom + padding;
        left = targetBounds.left + (targetBounds.width - cardWidth) / 2;
        break;
      case 'left':
        // 移动端可能需要调整为上下布局
        if (isMobile) {
          top = targetBounds.bottom + padding;
          left = (windowSize.width - cardWidth) / 2;
        } else {
          top = targetBounds.top + (targetBounds.height - cardHeight) / 2;
          left = targetBounds.left - cardWidth - padding;
        }
        break;
      case 'right':
        // 移动端可能需要调整为上下布局
        if (isMobile) {
          top = targetBounds.bottom + padding;
          left = (windowSize.width - cardWidth) / 2;
        } else {
          top = targetBounds.top + (targetBounds.height - cardHeight) / 2;
          left = targetBounds.right + padding;
        }
        break;
    }

    // 确保卡片在视口内
    top = Math.max(padding, Math.min(top, windowSize.height - cardHeight - padding));
    left = Math.max(padding, Math.min(left, windowSize.width - cardWidth - padding));

    return { top, left, transform: 'none' };
  }, [targetBounds, windowSize, currentStep, config.steps]);

  if (!isOpen) return null;

  const step = config.steps[currentStep];
  const isLastStep = currentStep === config.steps.length - 1;
  const cardPosition = getStepCardPosition();

  return createPortal(
    <div className={cn("fixed inset-0 z-[9999]", className)}>
      {/* 背景遮罩 */}
      <TourOverlay
        ref={overlayRef}
        target={targetBounds}
        padding={step.spotlightPadding}
        highlightColor={step.highlightColor}
        disabled={config.disableOverlay}
        allowClicksThruHole={step.allowClicksThruHole}
      />

      {/* 步骤卡片 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={stepCardRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="absolute z-10"
          style={cardPosition}
        >
          <Card className="w-full max-w-sm md:max-w-md lg:w-96 bg-background/95 backdrop-blur-sm border-2 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {step.title}
                    </CardTitle>
                    {config.showProgress && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {currentStep + 1} {locale.of} {config.steps.length}
                        </Badge>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                              width: `${((currentStep + 1) / config.steps.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRequestClose}
                  className="flex-shrink-0 -mt-1 -mr-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                
                {step.content && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    {step.content}
                  </div>
                )}

                {step.action && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={step.action.onClick}
                      className="w-full"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      {step.action.label}
                    </Button>
                  </div>
                )}

                {/* 导航按钮 */}
                {config.showNavigation !== false && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {currentStep > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePrevious}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          {locale.back}
                        </Button>
                      )}
                      {config.showSkip !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSkip}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {locale.skip}
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleNext}
                      size="sm"
                      className="ml-auto"
                    >
                      {isLastStep ? locale.last : locale.next}
                      {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

// 遮罩层组件
interface TourOverlayProps {
  target: DOMRect | null;
  padding?: number;
  highlightColor?: string;
  disabled?: boolean;
  allowClicksThruHole?: boolean;
}

const TourOverlay = React.forwardRef<HTMLDivElement, TourOverlayProps>(
  ({ target, padding = 8, highlightColor = 'rgba(255, 255, 255, 0.1)', disabled }, ref) => {
    if (disabled) return null;

    const createClipPath = () => {
      if (!target) return 'inset(0 0 0 0)';

      const { top, left, width, height } = target;
      const p = padding;

      // 创建一个带圆角的高亮区域
      const clipTop = Math.max(0, top - p);
      const clipLeft = Math.max(0, left - p);
      const clipWidth = width + p * 2;
      const clipHeight = height + p * 2;

      return `polygon(
        0% 0%,
        0% 100%,
        ${clipLeft}px 100%,
        ${clipLeft}px ${clipTop}px,
        ${clipLeft + clipWidth}px ${clipTop}px,
        ${clipLeft + clipWidth}px ${clipTop + clipHeight}px,
        ${clipLeft}px ${clipTop + clipHeight}px,
        ${clipLeft}px 100%,
        100% 100%,
        100% 0%
      )`;
    };

    return (
      <div
        ref={ref}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 40%),
            linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))
          `,
          clipPath: createClipPath()
        }}
      >
        {/* 高亮边框 */}
        {target && (
          <div
            className="absolute rounded-lg border-2 pointer-events-none"
            style={{
              top: target.top - padding,
              left: target.left - padding,
              width: target.width + padding * 2,
              height: target.height + padding * 2,
              borderColor: highlightColor,
              boxShadow: `0 0 0 4px ${highlightColor}20, 0 0 20px ${highlightColor}40`
            }}
          />
        )}
      </div>
    );
  }
);

TourOverlay.displayName = 'TourOverlay';

export default ProductTour;