import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { tourConfigs, defaultTourConfig } from "@/data/tour-config";
import type { TourConfig } from "@/components/ui/product-tour";
import { safeLocalStorage } from "@/lib/safe-storage";

const GUIDE_STORAGE_PREFIX = "hys:fms:guide:v1";
const LEGACY_STORAGE_KEYS = ["fms_tour_completed", "fms_tour_skipped"];
const START_TOUR_EVENT = "hys:fms:start-tour";

export const useProductTour = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageTour, setCurrentPageTour] =
    useState<TourConfig>(defaultTourConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTourPage, setActiveTourPage] = useState<string | null>(null);

  // 获取当前页面名称
  const getCurrentPageName = useCallback(() => {
    if (location.pathname === "/") return "home";
    const firstSegment = location.pathname.split("/").filter(Boolean)[0];
    return firstSegment && tourConfigs[firstSegment] ? firstSegment : "home";
  }, [location.pathname]);

  const getGuideStorageKey = useCallback(
    (pageName = getCurrentPageName()) => {
      return `${GUIDE_STORAGE_PREFIX}:${pageName}:seen`;
    },
    [getCurrentPageName],
  );

  const markGuideSeen = useCallback(
    (pageName = activeTourPage ?? getCurrentPageName()) => {
      safeLocalStorage.setItem(getGuideStorageKey(pageName), "true");
    },
    [activeTourPage, getCurrentPageName, getGuideStorageKey],
  );

  const hasSeenGuide = useCallback(
    (pageName = getCurrentPageName()) => {
      return safeLocalStorage.getItem(getGuideStorageKey(pageName)) === "true";
    },
    [getCurrentPageName, getGuideStorageKey],
  );

  // 检查是否应该显示当前页面引导
  const shouldShowTour = useCallback(() => {
    if (isOpen) {
      return false;
    }

    if (location.pathname === "/opening") {
      return false;
    }

    const currentPage = getCurrentPageName();
    const config = tourConfigs[currentPage] || defaultTourConfig;

    if (!config.steps.length || hasSeenGuide(currentPage)) {
      return false;
    }

    // 检查是否看过开场动画
    const hasVisited = safeLocalStorage.getItem("fms_has_visited") === "true";
    if (!hasVisited) {
      return false; // 如果还没有看过开场动画，不显示引导
    }

    return true;
  }, [getCurrentPageName, hasSeenGuide, isOpen, location.pathname]);

  // 检查是否是首次访问任何页面
  const isFirstTimeUser = useCallback(() => {
    const hasVisited = safeLocalStorage.getItem("fms_has_visited") === "true";
    return hasVisited && !hasSeenGuide(getCurrentPageName());
  }, [getCurrentPageName, hasSeenGuide]);

  // 启动当前页面引导
  const startTour = useCallback(() => {
    const currentPage = getCurrentPageName();
    const config = tourConfigs[currentPage] || defaultTourConfig;
    setActiveTourPage(currentPage);

    setCurrentPageTour({
      ...config,
      onComplete: () => {
        markGuideSeen(currentPage);
        setIsOpen(false);
        setActiveTourPage(null);
        config.onComplete?.();
      },
      onSkip: () => {
        markGuideSeen(currentPage);
        setIsOpen(false);
        setActiveTourPage(null);
        config.onSkip?.();
      },
    });

    setIsOpen(true);
  }, [getCurrentPageName, markGuideSeen]);

  // 手动启动引导（不检查条件）
  const startTourManually = useCallback(() => {
    const currentPage = getCurrentPageName();
    const config = tourConfigs[currentPage] || defaultTourConfig;
    setActiveTourPage(currentPage);

    setCurrentPageTour({
      ...config,
      onComplete: () => {
        markGuideSeen(currentPage);
        setIsOpen(false);
        setActiveTourPage(null);
        config.onComplete?.();
      },
      onSkip: () => {
        markGuideSeen(currentPage);
        setIsOpen(false);
        setActiveTourPage(null);
        config.onSkip?.();
      },
    });

    setIsOpen(true);
  }, [getCurrentPageName, markGuideSeen]);

  // 关闭引导
  const closeTour = useCallback(() => {
    markGuideSeen();
    setIsOpen(false);
    setActiveTourPage(null);
  }, [markGuideSeen]);

  // 重置引导状态
  const resetTour = useCallback(() => {
    for (const key of LEGACY_STORAGE_KEYS) {
      safeLocalStorage.removeItem(key);
    }

    for (const pageName of Object.keys(tourConfigs)) {
      safeLocalStorage.removeItem(`${GUIDE_STORAGE_PREFIX}:${pageName}:seen`);
    }
  }, []);

  // 获取引导统计信息（简化版）
  const getTourStats = useCallback(() => {
    const totalPages = Object.keys(tourConfigs).length;
    const seenPages = Object.keys(tourConfigs).filter((pageName) =>
      hasSeenGuide(pageName),
    ).length;

    return {
      totalPages,
      completedPages: seenPages,
      skippedPages: 0,
      remainingPages: totalPages - seenPages,
      completionRate:
        totalPages > 0 ? Math.round((seenPages / totalPages) * 100) : 0,
    };
  }, [hasSeenGuide]);

  // 页面变化时自动检查是否显示当前页面引导
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (shouldShowTour()) {
        startTour();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, isLoading, shouldShowTour, startTour]);

  // 初始化
  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleStartTour = () => {
      startTourManually();
    };

    window.addEventListener(START_TOUR_EVENT, handleStartTour);
    return () => window.removeEventListener(START_TOUR_EVENT, handleStartTour);
  }, [startTourManually]);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        // 页面隐藏时暂停引导
        setIsOpen(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    getTourStats,
  };
};

export default useProductTour;
