/**
 * 懒加载页面组件
 * 将大型页面组件进行懒加载以减少初始包体积
 */

/* eslint-disable react-refresh/only-export-components */

import {
  createLazyComponent,
  preloadComponents,
} from '@/utils/lazy-components';

// 懒加载页面组件
export const LazyDashboardPage = createLazyComponent(
  () =>
    import('@/pages/DashboardPage').then(module => ({
      default: module.DashboardPage,
    })),
  {
    isPage: true,
    loadingMessage: '加载仪表板...',
  }
);

export const LazyInventoryPage = createLazyComponent(
  () => import('@/pages/InventoryPage'),
  {
    isPage: true,
    loadingMessage: '加载库存管理...',
  }
);

// LazyAuthTestPage 已移除 - 认证系统已迁移到旧系统

export const LazyMedicineManagementPage = createLazyComponent(
  () => import('@/pages/MedicineManagementPage'),
  {
    isPage: true,
    loadingMessage: '加载药品管理...',
  }
);

// 旧出库页已保留为重定向，故无需专门懒加载

export const LazyReportsPage = createLazyComponent(
  () => import('@/pages/ReportsPage'),
  {
    isPage: true,
    loadingMessage: '加载报表分析...',
  }
);

export const LazyUserManagementPage = createLazyComponent(
  () =>
    import('@/pages/UserManagementPage').then(module => ({
      default: module.UserManagementPage,
    })),
  {
    isPage: true,
    loadingMessage: '加载用户管理...',
  }
);

export const LazyAuditLogsPage = createLazyComponent(
  () =>
    import('@/pages/AuditLogsPage').then(module => ({
      default: module.default,
    })),
  {
    isPage: true,
    loadingMessage: '加载审计日志...',
  }
);

// LazyAuthMigrationTest 已移除 - 认证系统已迁移到旧系统

// 懒加载大型组件
export const LazyInventoryList = createLazyComponent(
  () => import('@/components/inventory/InventoryList'),
  {
    loadingMessage: '加载库存列表...',
  }
);

export const LazyMedicineForm = createLazyComponent(
  () => import('@/components/inventory/MedicineForm'),
  {
    loadingMessage: '加载药品表单...',
  }
);

export const LazyBarcodeScanner = createLazyComponent(
  () => import('@/components/scanner/BarcodeScanner'),
  {
    loadingMessage: '加载扫码组件...',
  }
);

// 预加载策略
export const preloadStrategies = {
  // 预加载核心页面（用户最可能访问的页面）
  preloadCorePages: () => {
    preloadComponents([
      () => import('@/pages/DashboardPage'),
      () => import('@/pages/InventoryPage'),
      () => import('@/pages/InventoryOperationPage'),
    ]);
  },

  // 预加载管理页面（管理员用户可能访问）
  preloadManagementPages: () => {
    preloadComponents([
      () => import('@/pages/MedicineManagementPage'),
      () => import('@/pages/UserManagementPage'),
      () => import('@/pages/ReportsPage'),
    ]);
  },

  // 预加载扫码相关页面（统一入口）
  preloadScanPages: () => {
    preloadComponents([
      () => import('@/pages/InventoryOperationPage'),
      () => import('@/components/scanner/BarcodeScanner'),
    ]);
  },

  // 基于用户角色的智能预加载
  preloadByUserRole: (userRole: string) => {
    switch (userRole) {
      case 'admin':
        preloadStrategies.preloadManagementPages();
        preloadStrategies.preloadCorePages();
        break;
      case 'manager':
        preloadStrategies.preloadCorePages();
        preloadStrategies.preloadScanPages();
        break;
      case 'staff':
        preloadStrategies.preloadCorePages();
        preloadStrategies.preloadScanPages();
        break;
      default:
        preloadStrategies.preloadCorePages();
    }
  },

  // 基于时间的预加载（在用户空闲时预加载）
  preloadOnIdle: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadStrategies.preloadCorePages();
      });
    }
  },

  // 基于网络状况的预加载
  preloadByNetworkCondition: () => {
    const connection = (
      navigator as { connection?: { effectiveType: string; downlink: number } }
    ).connection;
    if (connection) {
      // 在快速网络下预加载更多内容
      if (connection.effectiveType === '4g' || connection.downlink > 2) {
        preloadStrategies.preloadManagementPages();
        preloadStrategies.preloadCorePages();
      } else {
        // 在慢速网络下只预加载核心页面
        preloadStrategies.preloadCorePages();
      }
    } else {
      // 无法检测网络状况时，预加载核心页面
      preloadStrategies.preloadCorePages();
    }
  },
};

// 导出预加载函数供应用初始化时使用
export const initializePreloading = (userRole?: string) => {
  // 延迟执行，避免影响初始加载性能
  setTimeout(() => {
    if (userRole) {
      preloadStrategies.preloadByUserRole(userRole);
    } else {
      preloadStrategies.preloadByNetworkCondition();
    }
  }, 2000); // 2秒后开始预加载
};
