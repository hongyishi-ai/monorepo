import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let cachedCss;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getHongyishiStaticAppShellCss() {
  cachedCss ??= readFileSync(
    fileURLToPath(new URL("./styles.css", import.meta.url)),
    "utf8",
  ).trim();

  return cachedCss;
}

export function renderStaticAppShellStyle() {
  return `<style data-hongyishi-app-shell>\n${getHongyishiStaticAppShellCss()}\n</style>`;
}

function iconPaths(icon) {
  if (icon === "moon") {
    return '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
  }

  if (icon === "sun") {
    return [
      '<circle cx="12" cy="12" r="4"></circle>',
      '<path d="M12 2v2"></path>',
      '<path d="M12 20v2"></path>',
      '<path d="m4.93 4.93 1.41 1.41"></path>',
      '<path d="m17.66 17.66 1.41 1.41"></path>',
      '<path d="M2 12h2"></path>',
      '<path d="M20 12h2"></path>',
      '<path d="m6.34 17.66-1.41 1.41"></path>',
      '<path d="m19.07 4.93-1.41 1.41"></path>',
    ].join("");
  }

  if (icon === "menu") {
    return [
      '<path d="M4 6h16"></path>',
      '<path d="M4 12h16"></path>',
      '<path d="M4 18h16"></path>',
    ].join("");
  }

  if (icon === "close") {
    return [
      '<path d="M18 6 6 18"></path>',
      '<path d="m6 6 12 12"></path>',
    ].join("");
  }

  throw new Error(`Unsupported Hongyishi icon: ${icon}`);
}

export function renderHongyishiIcon(icon) {
  return `<svg class="t-icon h-5 w-5" data-icon="${escapeHtml(icon)}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths(icon)}</svg>`;
}

export function renderStaticThemeToggle() {
  return `<button class="hys-mobile-theme-toggle hys-nav-link" type="button" aria-label="切换深浅色主题" data-hys-theme-toggle>
    <span class="t-icon-swap h-5 w-5 place-items-center" data-state="moon">
      ${renderHongyishiIcon("sun")}
      ${renderHongyishiIcon("moon")}
    </span>
  </button>`;
}

export function renderStaticMenuToggle({ menuId, ariaLabel }) {
  return `<button class="hys-mobile-top-menu__button hys-nav-link" type="button" aria-label="打开${escapeHtml(ariaLabel)}菜单" aria-expanded="false" aria-controls="${escapeHtml(menuId)}" data-hys-mobile-menu-toggle>
    <span class="t-icon-swap h-5 w-5 place-items-center" data-state="menu">
      ${renderHongyishiIcon("menu")}
      ${renderHongyishiIcon("close")}
    </span>
  </button>`;
}

export function renderStaticMobileMenuControls({ scope, ariaLabel, menuId }) {
  return `<div class="hys-mobile-top-menu t-panel-reveal" data-hongyishi-mobile-menu data-hys-mobile-menu-scope="${escapeHtml(scope)}" aria-label="${escapeHtml(ariaLabel)}">
  ${renderStaticThemeToggle()}
  ${renderStaticMenuToggle({ menuId, ariaLabel })}
</div>`;
}

export function renderStaticMobileMenuPanel({
  activeTab,
  config,
  menuId,
  tabs,
}) {
  const menuItems = tabs
    .map((tab, index) => {
      const isActive = tab.id === activeTab;
      const activeClass = isActive
        ? " active bg-accent text-primary hys-mobile-top-menu__link--active"
        : "";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      const title = `${config.titlePrefix}${tab.label}`;
      const staggerClass = `t-stagger-line--${Math.min(index + 1, 4)}`;

      return `<a class="hys-mobile-top-menu__link t-stagger-line ${staggerClass} hys-nav-link${activeClass}" href="${escapeHtml(tab.href)}"${ariaCurrent} title="${escapeHtml(title)}"><span>${escapeHtml(tab.label)}</span></a>`;
    })
    .join("");

  return `<div class="hys-mobile-top-menu__panel t-stagger lg:hidden border-t border-border bg-background" id="${escapeHtml(menuId)}" data-hys-mobile-menu-panel hidden>${menuItems}</div>`;
}

export function renderStaticAppShellController({ menuId, scope }) {
  return `<script data-hongyishi-app-shell>
(() => {
  const nav = document.querySelector('[data-hongyishi-mobile-menu][data-hys-mobile-menu-scope="${escapeHtml(scope)}"]');
  const button = nav?.querySelector('[data-hys-mobile-menu-toggle]');
  const panel = document.getElementById('${escapeHtml(menuId)}');
  const themeButton = nav?.querySelector('[data-hys-theme-toggle]');
  const menuIcon = button?.querySelector('.t-icon-swap');
  const themeIcon = themeButton?.querySelector('.t-icon-swap');
  const root = document.documentElement;
  if (!nav || !button || !panel) return;

  const setOpen = (isOpen) => {
    nav.classList.toggle('is-open', isOpen);
    nav.closest('.brand-nav')?.classList.toggle('hys-mobile-menu-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
    menuIcon?.setAttribute('data-state', isOpen ? 'close' : 'menu');
    panel.hidden = !isOpen;
  };

  const getPreferredTheme = () => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark');
    themeIcon?.setAttribute('data-state', theme === 'dark' ? 'sun' : 'moon');
    themeButton?.setAttribute('aria-label', '切换深浅色主题');
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  };

  applyTheme(getPreferredTheme());

  button.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setOpen(false);
  });

  themeButton?.addEventListener('click', (event) => {
    root.style.setProperty('--x', event.clientX + 'px');
    root.style.setProperty('--y', event.clientY + 'px');
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(nextTheme));
    } else {
      applyTheme(nextTheme);
    }
  });

  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !panel.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
</script>`;
}

export function renderTcccBrandShell({ flowTitle }) {
  const title = escapeHtml(flowTitle);

  return `
    <a class="hys-tccc-skip" href="#hys-tccc-main">跳到流程</a>
    <header class="hys-nav hys-static-project-nav brand-nav" data-hongyishi-tccc-shell data-hongyishi-app-shell>
      <div class="hys-container">
        <nav class="brand-nav-inner hys-static-nav-row" aria-label="红医师战场救护导航">
          <a class="hys-logo hys-static-logo brand-mark" href="/" aria-label="红医师 / 战场救护"><span class="brand-mark-red text-primary">红医师</span><span class="brand-mark-divider mx-2 text-muted-foreground">/</span><span>战场救护</span></a>
          <div class="brand-nav-links hidden lg:flex items-center space-x-2" aria-label="TCCC 导航">
            <a class="hys-nav-link brand-nav-link" href="/">总入口</a>
            <a class="hys-nav-link brand-nav-link" href="/tccc/">项目首页</a>
          </div>
        </nav>
      </div>
      <div class="hys-static-meta-strip border-t border-border bg-muted/40">
        <div class="hys-container">
          <div class="hys-static-meta-row">
            <strong>当前流程：${title}</strong>
            <span>教育训练用途</span>
            <span>内容状态：待复核</span>
            <span>CoTCCC 2017 基础内容，需按 JTS / Deployed Medicine 更新复核</span>
          </div>
        </div>
      </div>
    </header>
    <div id="hys-tccc-main" tabindex="-1"></div>`;
}

export function renderFallbackBrandHeader({ brand, project }) {
  return `
    <header class="hys-nav hys-static-project-nav brand-nav" data-hongyishi-app-shell>
      <div class="hys-container">
        <nav class="brand-nav-inner hys-static-nav-row" aria-label="${escapeHtml(project)}导航">
          <a class="hys-logo hys-static-logo brand-mark" href="/" aria-label="${escapeHtml(`${brand} / ${project}`)}"><span class="brand-mark-red text-primary">${escapeHtml(brand)}</span><span class="brand-mark-divider mx-2 text-muted-foreground">/</span><span>${escapeHtml(project)}</span></a>
          <div class="brand-nav-links hidden lg:flex items-center space-x-2">
            <a class="hys-nav-link brand-nav-link" href="/">总入口</a>
          </div>
        </nav>
      </div>
    </header>`;
}
