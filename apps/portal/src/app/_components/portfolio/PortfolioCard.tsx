import Image from 'next/image';
import styles from '@/app/_styles/constructivism.module.css';

type PortfolioCardProps = {
  title: string;
  type: string;
  description: string;
  href: string;
  coverImage: string;
  color: 'red' | 'blue' | 'yellow' | 'gray';
  featured?: boolean;
};

export function PortfolioCard({
  title,
  type,
  description,
  href,
  coverImage,
  color,
  featured = false,
}: PortfolioCardProps) {
  const colorClass = {
    red: styles.portfolioCardRed,
    blue: styles.portfolioCardBlue,
    yellow: styles.portfolioCardYellow,
    gray: styles.portfolioCardGray,
  }[color];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.portfolioCard} ${colorClass} ${featured ? 'md:col-span-2' : ''}`}
    >
      {/* 封面图片 */}
      <Image
        src={coverImage}
        alt={`${title}封面`}
        fill
        className={styles.portfolioCardCover}
        sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
      />
      
      {/* 叠加层 */}
      <div className={styles.portfolioCardOverlay} />
      
      {/* 内容 */}
      <div className={styles.portfolioCardContent}>
        <h3 
          className="text-3xl md:text-4xl lg:text-5xl font-normal uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", Impact, sans-serif)' }}
        >
          {title}
        </h3>
        
        <p 
          className="font-mono text-sm md:text-base font-bold uppercase text-white/70 mb-3"
        >
          {type}
        </p>
        
        <p className="text-sm md:text-base text-white/85 max-w-md leading-relaxed">
          {description}
        </p>
      </div>
    </a>
  );
}

