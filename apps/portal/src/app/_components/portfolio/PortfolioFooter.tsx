import Link from 'next/link';
import styles from '@/app/_styles/constructivism.module.css';

export function PortfolioFooter() {
  return (
    <footer className="border-t-4 border-constructivism-red dark:border-constructivism-red bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="font-mono text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 transition-colors duration-300">
            红医师 © 2014-2025
          </p>
          
          {/* 按钮组 - 并列显示 */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <Link 
              href="/blog"
              className={`inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-neutral-700 text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-constructivism-blue focus:ring-offset-2 focus:ring-offset-black dark:focus:ring-offset-neutral-800 ${styles.neoButton} ${styles["neoButton--yellow"]}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              了解更多
            </Link>
            
            <a
              href="mailto:nimrod1990@163.com"
              className={`inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-neutral-700 text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-constructivism-blue focus:ring-offset-2 focus:ring-offset-black dark:focus:ring-offset-neutral-800 ${styles.neoButton} ${styles["neoButton--blue"]}`}
              aria-label="通过邮件联系作者"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              联系作者
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

