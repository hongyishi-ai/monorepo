'use client';

import type { MouseEvent } from 'react';

type MobileLibraryPanelProps = {
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    destination: { href: string; title: string; posterImage?: string },
  ) => void;
};

const libraryItems = [
  {
    title: '热射病诊断治疗指南',
    label: '热射病',
    href: '/heat-stroke/pages/diagnosis-treatment-guideline',
    body: '一线识别、分级和转运处置依据。',
    posterImage: '/assets/brand-posters/heat-stroke.jpg',
  },
  {
    title: '热射病防治体系',
    label: '热射病',
    href: '/heat-stroke/pages/treatment-system-consensus',
    body: '训练组织、预警、现场降温与后送衔接。',
    posterImage: '/assets/brand-posters/heat-stroke.jpg',
  },
  {
    title: 'TCCC 标准流程',
    label: '战场救护',
    href: '/tccc/pages/tccc-standard',
    body: '按 MARCH、TFC 与 TACEVAC 路径快速查阅。',
    posterImage: '/assets/brand-posters/battlefield-care.jpg',
  },
  {
    title: '红医师内容',
    label: '内容',
    href: '/blog',
    body: '平台说明、迭代记录和后续资料入口。',
    posterImage: '/assets/brand-posters/hongyishi-brand.jpg',
  },
];

export function MobileLibraryPanel({ onNavigate }: MobileLibraryPanelProps) {
  return (
    <section className="px-4 pb-28 pt-6" aria-labelledby="mobile-library-title">
      <p className="font-mono text-[0.68rem] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        FIELD LIBRARY
      </p>
      <h1 id="mobile-library-title" className="mt-2 text-4xl font-black leading-tight text-black dark:text-white">
        资料
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#12313c] dark:text-neutral-300">
        先收拢能直接使用的指南、流程和内容入口。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {libraryItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(event) =>
              onNavigate(event, {
                href: item.href,
                title: item.title,
                posterImage: item.posterImage,
              })
            }
            className="block border-2 border-black bg-[#fff8e8] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.18)] transition-transform focus:outline-none focus:ring-2 focus:ring-constructivism-red focus:ring-offset-2 focus:ring-offset-[#f4ecdc] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_rgba(0,0,0,0.35)] dark:border-white/20 dark:bg-neutral-950 dark:focus:ring-offset-black"
          >
            <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-xs font-bold text-white">
              {item.label}
            </span>
            <span className="mt-3 block text-2xl font-black leading-snug text-black dark:text-white">
              {item.title}
            </span>
            <span className="mt-2 block text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              {item.body}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
