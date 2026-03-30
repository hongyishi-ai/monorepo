/**
 * 设计系统 Tokens
 * 集中管理颜色、字体、间距等设计系统配置
 */

// 颜色系统
export const colors = {
  // 主色调
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // 主色
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // 语义化颜色
  success: {
    light: '#34d399',
    DEFAULT: '#10b981',
    dark: '#059669',
  },
  warning: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#f87171',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },
  info: {
    light: '#3b82f6',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },

  // 中性色
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

// 字体系统
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ],
  },
  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// 间距系统
export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

// 圆角系统
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// 阴影系统
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// 响应式断点
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// 过渡动画
export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Z-index 层级
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  // 语义化层级
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
} as const;

// 药房业务专用配置
export const pharmacy = {
  // 库存状态颜色映射
  stockStatus: {
    sufficient: colors.success.DEFAULT,
    low: colors.warning.DEFAULT,
    empty: colors.error.DEFAULT,
  },

  // 近效期状态颜色映射
  expiryStatus: {
    normal: colors.gray[600],
    warning: colors.warning.DEFAULT,
    expired: colors.error.DEFAULT,
  },

  // 默认配置
  defaults: {
    expiryWarningDays: 30,
    lowStockThreshold: 10,
    pageSize: 20,
  },

  // 扫码相关配置
  scanner: {
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    targetBorderColor: colors.primary[600],
    targetBorderWidth: '2px',
  },
} as const;

// 组件变体配置
export const componentVariants = {
  button: {
    size: {
      sm: {
        height: '2.25rem',
        padding: '0 0.75rem',
        fontSize: typography.fontSize.sm[0],
      },
      md: {
        height: '2.5rem',
        padding: '0 1rem',
        fontSize: typography.fontSize.base[0],
      },
      lg: {
        height: '2.75rem',
        padding: '0 2rem',
        fontSize: typography.fontSize.lg[0],
      },
    },
    variant: {
      primary: {
        backgroundColor: colors.primary[600],
        color: 'white',
        hoverBackgroundColor: colors.primary[700],
      },
      secondary: {
        backgroundColor: colors.gray[100],
        color: colors.gray[900],
        hoverBackgroundColor: colors.gray[200],
      },
      success: {
        backgroundColor: colors.success.DEFAULT,
        color: 'white',
        hoverBackgroundColor: colors.success.dark,
      },
      warning: {
        backgroundColor: colors.warning.DEFAULT,
        color: 'white',
        hoverBackgroundColor: colors.warning.dark,
      },
      error: {
        backgroundColor: colors.error.DEFAULT,
        color: 'white',
        hoverBackgroundColor: colors.error.dark,
      },
    },
  },

  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    boxShadow: boxShadow.sm,
    backgroundColor: 'white',
    border: `1px solid ${colors.gray[200]}`,
  },

  input: {
    height: '2.5rem',
    padding: '0 0.75rem',
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray[300]}`,
    fontSize: typography.fontSize.base[0],
    focusBorderColor: colors.primary[600],
    focusRingColor: `${colors.primary[600]}33`, // 20% opacity
  },
} as const;

// 导出所有 tokens
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  breakpoints,
  transitions,
  zIndex,
  pharmacy,
  componentVariants,
} as const;

export default designTokens;
