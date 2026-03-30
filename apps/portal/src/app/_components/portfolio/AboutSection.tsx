import styles from '@/app/_styles/constructivism.module.css';

export function AboutSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-24 border-t border-neutral-200 dark:border-neutral-700 transition-colors duration-300" aria-labelledby="about-title">
      <h2 
        id="about-title"
        className="font-mono text-base md:text-lg text-neutral-500 dark:text-neutral-500 uppercase tracking-wide mb-8 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-full before:bg-constructivism-red transition-colors duration-300"
      >
        关于
      </h2>
      
      <div className="max-w-3xl">
        <p className="text-lg md:text-xl leading-relaxed mb-6 text-neutral-700 dark:text-neutral-300 transition-colors duration-300">
          我是<strong className="text-black dark:text-white font-bold">红医师</strong>，一名专注于<strong className="text-black dark:text-white font-bold">基层医疗</strong>与<strong className="text-black dark:text-white font-bold">信息化建设</strong>的临床医生和技术爱好者。
        </p>
        
        <p className="text-lg md:text-xl leading-relaxed mb-12 text-neutral-700 dark:text-neutral-300 transition-colors duration-300">
          致力于解决医疗保障中的实际问题，让技术真正服务于生命健康。
        </p>
        
        {/* 统计数据卡片（临时隐藏） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 hidden">
          <div className={styles.statCard}>
            <div 
              className="text-5xl md:text-6xl font-normal text-constructivism-red dark:text-constructivism-red mb-2 leading-none transition-colors duration-300"
              style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", Impact, sans-serif)' }}
            >
              4+
            </div>
            <div className="font-mono text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 transition-colors duration-300">
              核心项目
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div 
              className="text-5xl md:text-6xl font-normal text-constructivism-red dark:text-constructivism-red mb-2 leading-none transition-colors duration-300"
              style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", Impact, sans-serif)' }}
            >
              10K+
            </div>
            <div className="font-mono text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 transition-colors duration-300">
              服务用户
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div 
              className="text-5xl md:text-6xl font-normal text-constructivism-red dark:text-constructivism-red mb-2 leading-none transition-colors duration-300"
              style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", Impact, sans-serif)' }}
            >
              100%
            </div>
            <div className="font-mono text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 transition-colors duration-300">
              开源精神
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

