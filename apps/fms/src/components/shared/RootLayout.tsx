import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import ThemeToggle from '@/components/ui/theme-toggle';

const RootLayout = () => {
  const location = useLocation();
  const isMobileMenuOpen = useAppStore(state => state.isMobileMenuOpen);
  const setMobileMenuOpen = useAppStore(state => state.setMobileMenuOpen);



  const navigationItems = [
    { to: '/', label: '首页', exact: true, type: 'link' },
    { to: '/assessment', label: '开始评估', type: 'link' },
    { to: '/report', label: '查看报告', type: 'link' },
    { to: '/training', label: '训练方案', type: 'link' },
    { to: '/history', label: '历史记录', type: 'link' },
    { to: '/education', label: 'FMS知识', type: 'link' },
    { to: '/about', label: '关于本项目', type: 'link' },
  ];

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:rounded focus:bg-background focus:shadow focus:outline focus:outline-2 focus:-outline-offset-2"
      >
        跳到主内容
      </a>
      {/* 布鲁克林极简主义导航栏 */}
      <header className="brooklyn-nav">
        <div className="brooklyn-container">
          <nav className="flex items-center justify-between py-3">
            {/* Logo区域 */}
            <Link to="/" className="brooklyn-logo hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
              <span className="text-red-600 font-bold">红</span><span className="font-bold">医师</span> <span className="font-bold">训练伤防治平台</span>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "brooklyn-nav-link",
                      isActivePath(item.to, item.exact) && "active bg-accent text-primary"
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              {/* 主题切换按钮 */}
              <ThemeToggle />
            </div>

            {/* 移动端：主题切换按钮 + 汉堡菜单并排显示 */}
            <div className="lg:hidden flex items-center space-x-1">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                className="brooklyn-nav-link"
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </nav>

          {/* 移动端导航菜单 - 条件性显示 */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-background">
              <div className="py-4 space-y-2">
                {navigationItems.map((item) => (
                  <Link key={item.to} to={item.to} className="block" onClick={closeMobileMenu}>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "brooklyn-nav-link w-full justify-start",
                        isActivePath(item.to, item.exact) && "active bg-accent text-primary"
                      )}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
                {/* 主题切换按钮已移至顶部，这里移除 */}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 主要内容区域 */}
      <main id="main" className="flex-grow">
        <Outlet />
      </main>

      {/* 布鲁克林极简主义页脚 */}
      <footer className="brooklyn-footer">
        <div className="brooklyn-container">
          <div className="text-center space-y-4">
            <div className="brooklyn-footer-text">
              <p className="mb-2">
                动有道，行无疆。
              </p>
            </div>
            
            {/* 联系方式 */}
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="opacity-60">联系作者：</span>
              <a 
                href="mailto:nimrod1990@163.com" 
                className="text-primary hover:underline transition-colors"
                aria-label="发送邮件给作者"
              >
                nimrod1990@163.com
              </a>
            </div>
            
            {/* 版权声明 */}
            <div className="flex items-center justify-center space-x-6 text-sm opacity-60">
              <span>©2025 红医师 训练伤防治</span>
            </div>
            
            {/* 免责声明 */}
            <div className="text-xs opacity-50 max-w-4xl mx-auto">
              <p>
                <strong>免责声明：</strong>
                FMS并非临床诊断技术，评估结果仅供训练参考，不构成治疗建议。
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout; 