import Link from 'next/link';

export function Intro() {
  return (
    <section className="mt-16 mb-16 md:mb-12">
      {/* 返回作品集导航 */}
      <nav className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-neutral-600 dark:text-neutral-400 hover:text-constructivism-red dark:hover:text-constructivism-red transition-colors group"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-1"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </Link>
      </nav>
      
      <div className="flex-col md:flex-row flex items-center md:justify-between">
        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
          <span className="text-constructivism-red">红</span>医师.
        </h1>
        <h4 className="text-lg mt-5 text-neutral-800 dark:text-white/80 text-justify px-[1ch]">
          实践 = 知识 ⊗ 技术
        </h4>
      </div>
    </section>
  );
}
