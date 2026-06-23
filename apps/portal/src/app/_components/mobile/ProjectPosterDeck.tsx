'use client';

import Image from 'next/image';
import type { MouseEvent } from 'react';
import type { HongyishiPlatformProject } from '@/lib/projects';

type ProjectPosterDeckProps = {
  projects: HongyishiPlatformProject[];
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    destination: { href: string; title: string; posterImage?: string },
  ) => void;
};

export function ProjectPosterDeck({ projects, onNavigate }: ProjectPosterDeckProps) {
  return (
    <section id="mobile-tools" className="px-4 pb-28 pt-9" aria-labelledby="mobile-tools-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            TOOL DECK
          </p>
          <h2 id="mobile-tools-title" className="mt-2 text-2xl font-black text-black dark:text-white">
            工具舱
          </h2>
        </div>
        <p className="max-w-28 text-right text-xs leading-5 text-neutral-600 dark:text-neutral-400">
          三个项目均为站内入口
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.href}
            onClick={(event) =>
              onNavigate(event, {
                href: project.href,
                title: project.shortTitle,
                posterImage: project.coverImage,
              })
            }
            className="group grid grid-cols-[7.5rem_1fr] gap-4 border-2 border-black bg-[#fff8e8] p-3 shadow-[6px_6px_0_rgba(0,0,0,0.2)] transition-transform focus:outline-none focus:ring-2 focus:ring-constructivism-red focus:ring-offset-2 focus:ring-offset-[#f4ecdc] active:translate-x-1 active:translate-y-1 active:shadow-[3px_3px_0_rgba(0,0,0,0.35)] dark:border-white/20 dark:bg-neutral-950 dark:focus:ring-offset-black"
          >
            <span className="relative block aspect-[906/1280] overflow-hidden border-2 border-black dark:border-white/20">
              <Image
                src={project.coverImage}
                alt={`${project.shortTitle}海报`}
                fill
                className="object-cover transition-transform duration-300 group-active:scale-105"
                sizes="120px"
              />
            </span>

            <span className="flex min-w-0 flex-col justify-between py-1">
              <span>
                <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-[0.65rem] font-bold text-white">
                  站内入口
                </span>
                <span className="mt-3 block text-2xl font-black leading-tight text-black dark:text-white">
                  {project.shortTitle}
                </span>
                <span className="mt-2 block text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                  {project.content.entryLabel}
                </span>
              </span>
              <span className="mt-5 block border-t border-black/15 pt-3 font-mono text-[0.68rem] leading-5 text-neutral-500 dark:border-white/15 dark:text-neutral-500">
                {project.content.status === 'current' ? '已复核' : '待复核'} · {project.content.reviewedAt}
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
