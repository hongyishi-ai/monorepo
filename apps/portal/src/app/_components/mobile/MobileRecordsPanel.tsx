'use client';

import type { MouseEvent } from 'react';

type MobileRecordsPanelProps = {
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    destination: { href: string; title: string; posterImage?: string },
  ) => void;
};

const records = [
  {
    title: '继续本机记录',
    label: '记录',
    href: '/fms/history',
    body: '回到历史记录、报告和本地导出入口，保持数据不上云。',
  },
  {
    title: '开始 FMS 评估',
    label: '评估',
    href: '/fms/assessment',
    body: '记录训练伤风险，生成训练建议和可导出的报告。',
  },
  {
    title: '训练流程',
    label: '资料',
    href: '/fms/training',
    body: '查看 FMS 教育评估流程，适合现场复盘和带教使用。',
  },
];

export function MobileRecordsPanel({ onNavigate }: MobileRecordsPanelProps) {
  return (
    <section className="px-4 pb-28 pt-6" aria-labelledby="mobile-records-title">
      <p className="font-mono text-[0.68rem] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        LOCAL RECORDS
      </p>
      <h1 id="mobile-records-title" className="mt-2 text-4xl font-black leading-tight text-black dark:text-white">
        记录
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#12313c] dark:text-neutral-300">
        先保留本机记录和导出能力，不引入付费数据库。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {records.map((record) => (
          <a
            key={record.href}
            href={record.href}
            onClick={(event) =>
              onNavigate(event, {
                href: record.href,
                title: record.title,
                posterImage: '/assets/brand-posters/training-injury.jpg',
              })
            }
            className="block border-2 border-black bg-[#fff8e8] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.18)] transition-transform focus:outline-none focus:ring-2 focus:ring-constructivism-red focus:ring-offset-2 focus:ring-offset-[#f4ecdc] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_rgba(0,0,0,0.35)] dark:border-white/20 dark:bg-neutral-950 dark:focus:ring-offset-black"
          >
            <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-xs font-bold text-white">
              {record.label}
            </span>
            <span className="mt-3 block text-2xl font-black leading-snug text-black dark:text-white">
              {record.title}
            </span>
            <span className="mt-2 block text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              {record.body}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
