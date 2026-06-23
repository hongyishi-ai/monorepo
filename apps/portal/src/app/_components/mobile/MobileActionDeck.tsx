'use client';

import type { MouseEvent } from 'react';
import { getTaskUrgencyLabel } from '@/lib/task-entries';
import type { MobileQuickAction } from '@/lib/mobile';

type MobileActionDeckProps = {
  actions: MobileQuickAction[];
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    destination: { href: string; title: string; posterImage?: string },
  ) => void;
};

export function MobileActionDeck({ actions, onNavigate }: MobileActionDeckProps) {
  const [primaryAction, ...secondaryActions] = actions;

  return (
    <section id="mobile-actions" className="px-4 pt-6" aria-labelledby="mobile-actions-title">
      <p className="font-mono text-[0.68rem] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        HONGYISHI.CN / 一线医疗工具
      </p>
      <h1 id="mobile-actions-title" className="mt-2 text-5xl font-black leading-none text-constructivism-red">
        红医师
      </h1>
      <p className="mt-3 text-base font-medium leading-7 text-[#12313c] dark:text-neutral-200">
        以赤诚，护生命。
      </p>

      {primaryAction ? (
        <a
          href={primaryAction.href}
          onClick={(event) =>
            onNavigate(event, {
              href: primaryAction.href,
              title: primaryAction.label,
              posterImage: primaryAction.posterImage,
            })
          }
          className="mt-6 block border-3 border-black bg-constructivism-red p-5 text-white shadow-[7px_7px_0_rgba(0,0,0,0.28)] transition-transform focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-[#f4ecdc] active:translate-x-1 active:translate-y-1 active:shadow-[3px_3px_0_rgba(0,0,0,0.45)] dark:border-white/25 dark:focus:ring-white dark:focus:ring-offset-black"
        >
          <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-xs font-bold text-white">
            {getTaskUrgencyLabel(primaryAction.urgency)}
          </span>
          <span className="mt-5 block text-3xl font-black leading-tight">
            {primaryAction.label}
          </span>
          <span className="mt-3 block text-base leading-7 text-white/90">
            {primaryAction.intent}
          </span>
          <span className="mt-6 block border-t border-white/25 pt-3 font-mono text-[0.68rem] leading-5 text-white/75">
            {primaryAction.projectTitle} · {primaryAction.sourceNote}
          </span>
        </a>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3">
        {secondaryActions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            onClick={(event) =>
              onNavigate(event, {
                href: action.href,
                title: action.label,
                posterImage: action.posterImage,
              })
            }
            className="group block border-2 border-black bg-[#fff8e8] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.18)] transition-transform focus:outline-none focus:ring-2 focus:ring-constructivism-red focus:ring-offset-2 focus:ring-offset-[#f4ecdc] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_rgba(0,0,0,0.35)] dark:border-white/20 dark:bg-neutral-950 dark:focus:ring-offset-black"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-xs font-bold text-white group-active:bg-constructivism-red">
                  {getTaskUrgencyLabel(action.urgency)}
                </span>
                <h2 className="mt-3 text-xl font-black leading-snug text-black dark:text-white">
                  {action.label}
                </h2>
              </div>
              <span className="font-mono text-[0.68rem] font-bold text-neutral-500 dark:text-neutral-500">
                {action.projectTitle}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              {action.intent}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
