"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type ProjectChromeProps = {
  bottomItems: NavItem[];
  menuItems: NavItem[];
};

const portalThemeKey = "hongyishi-blog-theme";
const staticProjectThemeKey = "theme";

function readStoredTheme(): "light" | "dark" {
  const portalTheme = localStorage.getItem(portalThemeKey);
  if (portalTheme === "light" || portalTheme === "dark") return portalTheme;

  const staticTheme = localStorage.getItem(staticProjectThemeKey);
  if (staticTheme === "light" || staticTheme === "dark") return staticTheme;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-mode", theme);
  localStorage.setItem(portalThemeKey, theme);
  localStorage.setItem(staticProjectThemeKey, theme);
}

function Icon({ name }: { name: "menu" | "close" | "moon" | "sun" }) {
  const common = {
    "aria-hidden": true,
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  if (name === "moon") {
    return (
      <svg {...common}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    );
  }

  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function ProjectChrome({ bottomItems, menuItems }: ProjectChromeProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const headerRef = useRef<HTMLElement>(null);
  const menuPanelId = "hys-mobile-top-menu-panel-heatStroke";

  useEffect(() => {
    const initialTheme = readStoredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    const handleClick = (event: globalThis.MouseEvent) => {
      if (
        isMenuOpen &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isMenuOpen]);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const run = () => {
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };
    const viewTransition = (
      document as Document & {
        startViewTransition?: (callback: () => void) => void;
      }
    ).startViewTransition;

    document.documentElement.style.setProperty("--x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--y", `${event.clientY}px`);

    if (viewTransition) {
      viewTransition.call(document, run);
    } else {
      run();
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="brand-nav sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        data-hongyishi-project-theme-owner
      >
        <nav
          aria-label="热射病防治导航"
          className="mx-auto flex min-h-[78px] w-[min(1200px,calc(100%_-_32px))] items-center justify-between gap-3 border-b-2 border-border py-3 lg:border-b-0"
        >
          <a
            aria-label="红医师 / 热射病防治"
            className="min-w-0 text-[clamp(1.15rem,6.2vw,1.8rem)] font-black leading-none text-foreground no-underline"
            href="/heat-stroke/"
          >
            <span className="text-primary">红医师</span>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>热射病防治</span>
          </a>

          <div
            className="hidden items-center gap-1 lg:flex"
            aria-label="热射病防治桌面导航"
          >
            {menuItems.slice(0, 5).map((item) => (
              <a
                key={item.id}
                className="rounded px-3 py-2 text-sm font-black text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-accent-foreground"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div
            aria-label="热射病项目移动端菜单"
            className="hys-mobile-top-menu flex flex-none items-center gap-1"
            data-hongyishi-mobile-menu
            data-hys-mobile-menu-scope="heatStroke"
          >
            <button
              aria-label="切换深浅色主题"
              className="inline-grid min-h-10 min-w-10 place-items-center rounded text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              data-hys-theme-toggle
              onClick={toggleTheme}
              type="button"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <button
              aria-controls={menuPanelId}
              aria-expanded={isMenuOpen}
              aria-label={
                isMenuOpen ? "关闭菜单" : "打开热射病项目移动端导航菜单"
              }
              className="inline-grid min-h-14 min-w-14 place-items-center rounded bg-accent text-accent-foreground transition-transform active:translate-y-px lg:hidden"
              data-hys-mobile-menu-toggle
              onClick={() => setIsMenuOpen((current) => !current)}
              type="button"
            >
              <Icon name={isMenuOpen ? "close" : "menu"} />
            </button>
          </div>
        </nav>

        <div
          className="mx-auto w-[min(1200px,calc(100%_-_32px))] border-b-2 border-border py-4 lg:hidden"
          hidden={!isMenuOpen}
          id={menuPanelId}
        >
          <div className="grid gap-1">
            {menuItems.map((item) => (
              <a
                aria-current={item.id === "library" ? "page" : undefined}
                className={`min-h-[58px] rounded px-4 py-4 text-lg font-black no-underline transition-colors ${
                  item.id === "library"
                    ? "bg-card text-primary shadow-[inset_0_-3px_0_hsl(var(--primary))]"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                href={item.href}
                key={item.id}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <nav
        aria-label="热射病项目移动端导航"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t-2 border-foreground bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)] pt-2 shadow-[0_-10px_28px_rgba(0,0,0,0.16)] backdrop-blur md:hidden"
        data-hongyishi-mobile-nav
        data-hys-mobile-nav-scope="heatStroke"
      >
        {bottomItems.map((item) => {
          const isActive = item.id === "library";

          return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[54px] items-center justify-center rounded-sm border-2 px-2 text-center font-mono text-[13px] font-black leading-tight no-underline transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-transparent text-muted-foreground"
              }`}
              href={item.href}
              key={item.id}
              title={`打开热射病${item.label}`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
