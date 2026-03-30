/**
 * 错误边界相关的工具函数和类型
 */

// 错误边界配置预设
export const errorBoundaryPresets = {
  // 页面级错误边界
  page: {
    fallbackTitle: '页面加载失败',
    fallbackMessage: '页面遇到了一些问题，请刷新页面重试',
    showReload: true,
  },
  // 组件级错误边界
  component: {
    fallbackTitle: '组件错误',
    fallbackMessage: '此组件暂时不可用',
    showReload: false,
  },
  // 表单级错误边界
  form: {
    fallbackTitle: '表单错误',
    fallbackMessage: '表单处理遇到问题，请重试',
    showReload: false,
  },
} as const;

// 错误类型检查工具
export const isReactError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const isUseLayoutEffectError = (error: unknown): boolean => {
  if (!isReactError(error)) return false;
  return (
    error.message.includes('useLayoutEffect') ||
    error.message.includes('Cannot read properties of undefined')
  );
};
