import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/**
 * ThemeToggle 主题切换按钮
 *
 * 放置在导航栏或任何需要的位置。
 * 点击时调用 View Transitions API（若可用）实现丝滑的圆形遮罩动画。
 */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    toggleTheme(clientX, clientY);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="brooklyn-nav-link"
      onClick={handleClick}
      aria-label="切换深浅色主题"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
};

export default ThemeToggle; 