import { PortfolioHero } from './_components/portfolio/PortfolioHero';
import { PortfolioGrid } from './_components/portfolio/PortfolioGrid';
import { AboutSection } from './_components/portfolio/AboutSection';
import { PortfolioFooter } from './_components/portfolio/PortfolioFooter';

export const metadata = {
  title: '红医师',
  description: '以代码为手术刀，解决棘手问题。专注军事医学、应急响应与技术创新的作品集。',
  openGraph: {
    title: '红医师',
    description: '以代码为手术刀，解决棘手问题',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen transition-colors duration-300">
      <PortfolioHero />
      <main className="py-16 md:py-20">
        <div className="animate-on-load animate-fade-in-up">
          <PortfolioGrid />
        </div>
        <div className="animate-on-load animate-fade-in-up delay-200">
          <AboutSection />
        </div>
      </main>
      <PortfolioFooter />
    </div>
  );
}

