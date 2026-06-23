'use client';

import Image from 'next/image';

export type RouteLoadingDestination = {
  href: string;
  title: string;
  posterImage?: string;
};

type RouteLoadingOverlayProps = {
  destination: RouteLoadingDestination | null;
};

export function RouteLoadingOverlay({ destination }: RouteLoadingOverlayProps) {
  if (!destination) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8 text-white" role="status" aria-live="polite">
      <div className="w-full max-w-xs">
        <div className="relative mx-auto aspect-[906/1280] w-48 overflow-hidden border-2 border-white/35 shadow-[10px_10px_0_rgba(217,48,37,0.65)]">
          <Image
            src={destination.posterImage ?? '/assets/brand-posters/hongyishi-brand.jpg'}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="192px"
          />
          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-constructivism-red">
          LOADING
        </p>
        <p className="mt-3 text-3xl font-black leading-tight">
          正在进入{destination.title}
        </p>
        <p className="mt-4 break-all font-mono text-[0.68rem] leading-5 text-white/55">
          {destination.href}
        </p>
      </div>
    </div>
  );
}
