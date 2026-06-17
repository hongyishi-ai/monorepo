import { PortfolioHero } from './_components/portfolio/PortfolioHero';
import { PortfolioGrid } from './_components/portfolio/PortfolioGrid';
import { AboutSection } from './_components/portfolio/AboutSection';
import { PortfolioFooter } from './_components/portfolio/PortfolioFooter';

export const metadata = {
  title: '红医师',
  description: '红医师医疗软件、训练伤防治与热射病防治工具的统一入口平台。',
  openGraph: {
    title: '红医师',
    description: '红医师医疗工具统一入口平台',
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
        <div className="animate-on-load animate-fade-in-up delay-200">
          <AboutSection />
        </div>
      </main>
      <PortfolioFooter />
    </div>
  );
}
