import Image from 'next/image';
import styles from '@/app/_styles/constructivism.module.css';
import {
  getProjectContentStatusLabel,
  getProjectEntryKindLabel,
  getProjectStatusLabel,
  isExternalProject,
  type HongyishiProjectContent,
  type HongyishiProjectColor,
  type HongyishiProjectStatus,
} from '@/lib/projects';

type PortfolioCardProps = {
  title: string;
  type: string;
  description: string;
  href: string;
  coverImage: string;
  color: HongyishiProjectColor;
  status: HongyishiProjectStatus;
  content?: HongyishiProjectContent;
};

export function PortfolioCard({
  title,
  type,
  description,
  href,
  coverImage,
  color,
  status,
  content,
}: PortfolioCardProps) {
  const projectLinkMeta = { href, status };
  const isExternal = isExternalProject(projectLinkMeta);
  const statusLabel = getProjectStatusLabel(status);
  const entryKindLabel = getProjectEntryKindLabel(projectLinkMeta);
  const colorClass = {
    red: styles.portfolioCardRed,
    blue: styles.portfolioCardBlue,
    yellow: styles.portfolioCardYellow,
    gray: styles.portfolioCardGray,
  }[color];

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`${styles.portfolioCard} ${colorClass}`}
    >
      {/* 封面图片 */}
      <Image
        src={coverImage}
        alt={`${title}封面`}
        fill
        className={styles.portfolioCardCover}
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      
      {/* 叠加层 */}
      <div className={styles.portfolioCardOverlay} />
      
      {/* 内容 */}
      <div className={styles.portfolioCardContent}>
        <div className="mb-auto flex items-center justify-between gap-3">
          <span className="bg-white px-3 py-1 font-mono text-xs font-bold text-black">
            {statusLabel}
          </span>
          <span className="font-mono text-xs font-bold text-white/70">
            {entryKindLabel}
          </span>
        </div>

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

        {content ? (
          <div className="mt-5 max-w-md border-t border-white/25 pt-4 font-mono text-[0.68rem] leading-5 text-white/75">
            <p className="font-bold text-white">
              {content.entryLabel ?? content.sourceName}
            </p>
            <p>
              {getProjectContentStatusLabel(content.status)} · {content.reviewedAt} · {content.version}
            </p>
          </div>
        ) : null}
      </div>
    </a>
  );
}
