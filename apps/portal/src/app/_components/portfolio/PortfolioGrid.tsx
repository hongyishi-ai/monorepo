import { PortfolioCard } from './PortfolioCard';
import { platformProjects } from '@/lib/projects';

export function PortfolioGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 mb-24" aria-labelledby="portfolio-title">
      <h2 
        id="portfolio-title"
        className="font-mono text-base md:text-lg text-neutral-500 dark:text-neutral-500 uppercase tracking-wide mb-8 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-full before:bg-constructivism-red transition-colors duration-300"
      >
        工具阵列
      </h2>
      <p className="mb-8 max-w-2xl text-base leading-7 text-neutral-700 dark:text-neutral-300">
        已整合项目直接进入站内工具，外部运行项目保留原入口。后续重构以保留功能和统一视觉为前提逐步迁移。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {platformProjects.map((project) => (
          <PortfolioCard key={project.href} {...project} />
        ))}
      </div>
    </section>
  );
}
