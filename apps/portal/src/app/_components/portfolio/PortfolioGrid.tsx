import { PortfolioCard } from './PortfolioCard';

const projects = [
  {
    title: '热射病防治平台',
    type: '[指南解读 / 一线工具]',
    description: '热射病风险评估、预防、处置资源整合平台',
    href: 'https://reshebing.hongyishi.cn',
    coverImage: '/assets/portfolio/covers/reshebing.jpg',
    color: 'red' as const,
    featured: true,
  },
  {
    title: '基层疾病辅助诊断平台',
    type: '[AI医疗 / 基层应用]',
    description: '人工智能辅助基层进行疾病诊断和治疗决策',
    href: 'https://clinic2.hongyishi.cn',
    coverImage: '/assets/portfolio/covers/clinic.jpg',
    color: 'blue' as const,
  },
  {
    title: '便携式药品管理系统',
    type: '[数字化药房 / 移动场景]',
    description: '移动场景下的智能药品管理与使用',
    href: 'https://yf.hongyishi.cn',
    coverImage: '/assets/portfolio/covers/yf.jpg',
    color: 'yellow' as const,
  },
  {
    title: '训练伤防治平台',
    type: '[动作筛查 / 康复训练]',
    description: '基于FMS评估的训练伤风险筛查和康复训练',
    href: 'https://fms.hongyishi.cn',
    coverImage: '/assets/portfolio/covers/fms.jpg',
    color: 'gray' as const,
  },
];

export function PortfolioGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 mb-24" aria-labelledby="portfolio-title">
      <h2 
        id="portfolio-title"
        className="font-mono text-base md:text-lg text-neutral-500 dark:text-neutral-500 uppercase tracking-wide mb-8 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-full before:bg-constructivism-red transition-colors duration-300"
      >
        项目入口
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {projects.map((project) => (
          <PortfolioCard key={project.href} {...project} />
        ))}
      </div>
    </section>
  );
}

