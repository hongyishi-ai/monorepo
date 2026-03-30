export function PortfolioHero() {
  return (
    <header className="relative min-h-screen flex items-center px-6 md:px-8 border-b-4 border-constructivism-red dark:border-constructivism-red overflow-hidden transition-colors duration-300">
      {/* 黄色菱形装饰 */}
      <div 
        className="absolute top-[20%] right-[10%] w-32 h-32 bg-constructivism-yellow dark:bg-constructivism-blue opacity-10 dark:opacity-20 transform rotate-45 transition-all duration-300"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
        aria-hidden="true"
      />
      
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <a 
          href="/" 
          className="inline-block font-mono text-2xl md:text-3xl font-bold text-constructivism-red dark:text-constructivism-red mb-8 hover:translate-x-1 transition-all duration-300"
          aria-label="红医师主页"
        >
          红医师
        </a>
        
        <h1 
          className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight uppercase tracking-tight text-black dark:text-white transition-colors duration-300"
          style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", Impact, sans-serif)' }}
        >
          持续构建现代化医疗平台，<br />
          赋能基层。
        </h1>
      </div>
    </header>
  );
}

