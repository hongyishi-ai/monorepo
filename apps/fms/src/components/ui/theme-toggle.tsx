import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

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
      className="hys-nav-link"
      onClick={handleClick}
      aria-label="切换深浅色主题"
    >
      <span
        className="t-icon-swap h-5 w-5 place-items-center"
        data-state={theme === "dark" ? "sun" : "moon"}
      >
        <Sun className="t-icon h-5 w-5" data-icon="sun" aria-hidden="true" />
        <Moon className="t-icon h-5 w-5" data-icon="moon" aria-hidden="true" />
      </span>
    </Button>
  );
};

export default ThemeToggle;
