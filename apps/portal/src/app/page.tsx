import { PortfolioHero } from './_components/portfolio/PortfolioHero';
import { PortfolioGrid } from './_components/portfolio/PortfolioGrid';
import { PortfolioFooter } from './_components/portfolio/PortfolioFooter';

export const metadata = {
  title: '红医师',
  description: '红医师一线医疗工具：热射病防治、训练伤防治与战场救护。',
  openGraph: {
    title: '红医师',
    description: '红医师一线医疗工具',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="bg-[#f4ecdc] dark:bg-black text-black dark:text-white min-h-screen transition-colors duration-300">
      <PortfolioHero />
      <main className="py-16 md:py-20">
        <div className="animate-on-load animate-fade-in-up">
          <PortfolioGrid />
        </div>
      </main>
      <PortfolioFooter />
    </div>
  );
}
