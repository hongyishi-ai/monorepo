import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { type ThemeMode, useTheme } from "@/hooks/useTheme";

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof Monitor;
}> = [
  { mode: "system", label: "跟随系统", icon: Monitor },
  { mode: "light", label: "日间", icon: Sun },
  { mode: "dark", label: "夜间", icon: Moon },
];

const ThemeToggle = () => {
  const { mode, setThemeMode } = useTheme();
  const current = themeOptions.find((item) => item.mode === mode) ?? themeOptions[0];
  const CurrentIcon = current.icon;

  const handleChange = (nextMode: string) => {
    if (nextMode === "system" || nextMode === "light" || nextMode === "dark") {
      setThemeMode(nextMode);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hys-nav-link hys-theme-trigger"
          aria-label={`主题：${current.label}`}
          data-hongyishi-theme-control
        >
          <CurrentIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="hys-theme-menu min-w-[9rem] rounded border-2 border-border bg-popover p-1 font-mono shadow-[8px_8px_0_hsl(var(--border)/0.22)]"
      >
        <DropdownMenuRadioGroup value={mode} onValueChange={handleChange}>
          {themeOptions.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuRadioItem
                key={item.mode}
                value={item.mode}
                className="hys-theme-menu__item cursor-pointer rounded-sm py-2 pr-2 text-sm font-black focus:bg-accent focus:text-accent-foreground"
              >
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
