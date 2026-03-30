import { useCallback, useEffect, useState } from 'react';

// 定义主题类型
export type Theme = 'light' | 'dark';

/**
 * useTheme Hook
 *
 * 1. 根据 localStorage 中保存的用户偏好或操作系统首选项确定初始主题。
 * 2. 在 HTML <html> 元素上切换 `dark` class，以配合 Tailwind 的暗色模式。
 * 3. 提供 `toggleTheme` 方法，并在支持 View Transitions API 的浏览器中
 *    使用 `startViewTransition` 创建丝滑的主题切换动画。
 * 4. 点击位置 (x, y) 会写入 CSS 变量 `--x`、`--y`，用于生成径向遮罩动画中心点。
 */
export function useTheme() {
  const getPreferredTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';

    // 用户本地存储优先
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // window.matchMedia 可能在测试环境中不可用
    if (typeof window.matchMedia !== 'function') {
      return 'light';
    }

    // 否则参考系统偏好
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    return mql.matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  // 每当 theme 改变时，同步到 <html> class 以及 localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * 切换主题
   * @param x 点击中心 X 坐标（用于动画，可选）
   * @param y 点击中心 Y 坐标（用于动画，可选）
   */
  const toggleTheme = useCallback((x?: number, y?: number) => {
    const root = typeof document !== 'undefined' ? document.documentElement : null;

    // 把点击位置写入 CSS 变量，供 ::view-transition-new 使用
    if (root && typeof x === 'number' && typeof y === 'number') {
      root.style.setProperty('--x', `${x}px`);
      root.style.setProperty('--y', `${y}px`);
    }

    const switchTheme = () => {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    // 若浏览器不支持 View Transitions API，直接切换
    if (!document?.startViewTransition) {
      switchTheme();
      return;
    }

    // 使用 View Transitions API 进行动画切换
    document.startViewTransition(() => {
      switchTheme();
    });
  }, []);

  return {
    theme,
    toggleTheme,
  };
} 