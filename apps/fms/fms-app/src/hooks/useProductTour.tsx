import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { tourConfigs, defaultTourConfig } from '@/data/tour-config';
import type { TourConfig } from '@/components/ui/product-tour';

// 本地存储键值
const STORAGE_KEYS = {
  TOUR_COMPLETED: 'fms_tour_completed',
  TOUR_SKIPPED: 'fms_tour_skipped'
};

export const useProductTour = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageTour, setCurrentPageTour] = useState<TourConfig>(defaultTourConfig);
  const [isLoading, setIsLoading] = useState(true);

  // 获取当前页面名称（简化版，仅支持首页）
  const getCurrentPageName = useCallback(() => {
    return location.pathname === '/' ? 'home' : 'home';
  }, [location.pathname]);

  // 检查是否应该显示引导（仅在首页）
  const shouldShowTour = useCallback(() => {
    // 只在首页显示引导
    if (location.pathname !== '/') {
      return false;
    }

    // 检查是否已经完成或跳过了引导
    const tourCompleted = localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) === 'true';
    const tourSkipped = localStorage.getItem(STORAGE_KEYS.TOUR_SKIPPED) === 'true';
    
    if (tourCompleted || tourSkipped) {
      return false;
    }

    // 检查是否看过开场动画
    const hasVisited = localStorage.getItem('fms_has_visited') === 'true';
    if (!hasVisited) {
      return false; // 如果还没有看过开场动画，不显示引导
    }

    return true;
  }, [location.pathname]);

  // 检查是否是首次访问任何页面
  const isFirstTimeUser = useCallback(() => {
    const tourCompleted = localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) === 'true';
    const tourSkipped = localStorage.getItem(STORAGE_KEYS.TOUR_SKIPPED) === 'true';
    const hasVisited = localStorage.getItem('fms_has_visited') === 'true';
    
    return hasVisited && !tourCompleted && !tourSkipped;
  }, []);

  // 启动引导（仅首页）
  const startTour = useCallback(() => {
    const config = tourConfigs.home || defaultTourConfig;
    
    setCurrentPageTour({
      ...config,
      onComplete: () => {
        localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
        setIsOpen(false);
        config.onComplete?.();
      },
      onSkip: () => {
        localStorage.setItem(STORAGE_KEYS.TOUR_SKIPPED, 'true');
        setIsOpen(false);
        config.onSkip?.();
      }
    });
    
    setIsOpen(true);
  }, []);

  // 手动启动引导（不检查条件）
  const startTourManually = useCallback(() => {
    const config = tourConfigs.home || defaultTourConfig;
    
    setCurrentPageTour({
      ...config,
      onComplete: () => {
        setIsOpen(false);
        config.onComplete?.();
      },
      onSkip: () => {
        setIsOpen(false);
        config.onSkip?.();
      }
    });
    
    setIsOpen(true);
  }, []);

  // 关闭引导
  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 重置引导状态
  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOUR_COMPLETED);
    localStorage.removeItem(STORAGE_KEYS.TOUR_SKIPPED);
  }, []);

  // 获取引导统计信息（简化版）
  const getTourStats = useCallback(() => {
    const tourCompleted = localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) === 'true';
    const tourSkipped = localStorage.getItem(STORAGE_KEYS.TOUR_SKIPPED) === 'true';
    
    return {
      totalPages: 1,
      completedPages: tourCompleted ? 1 : 0,
      skippedPages: tourSkipped ? 1 : 0,
      remainingPages: (tourCompleted || tourSkipped) ? 0 : 1,
      completionRate: (tourCompleted || tourSkipped) ? 100 : 0
    };
  }, []);

  // 页面变化时自动检查是否显示引导（仅首页）
  useEffect(() => {
    if (isLoading) return;
    
    // 只在首页检查
    if (location.pathname !== '/') {
      setIsLoading(false);
      return;
    }
    
    // 延迟检查，确保页面已完全加载并且开场动画已完成
    const timer = setTimeout(() => {
      if (shouldShowTour()) {
        startTour();
      }
    }, 2000); // 2秒延迟，确保开场动画完成和页面元素已渲染

    return () => clearTimeout(timer);
  }, [location.pathname, isLoading, shouldShowTour, startTour]);

  // 初始化
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        // 页面隐藏时暂停引导
        setIsOpen(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen]);

  return {
    // 状态
    isOpen,
    isLoading,
    currentPageTour,
    
    // 检查函数
    shouldShowTour: shouldShowTour(),
    isFirstTimeUser: isFirstTimeUser(),
    getCurrentPageName,
    
    // 控制函数
    startTour,
    startTourManually,
    closeTour,
    resetTour,
    
    // 统计信息
    getTourStats
  };
};

export default useProductTour;