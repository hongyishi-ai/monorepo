'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import GithubSlugger from 'github-slugger'
import CircularReadingProgress from './circular-reading-progress'

type TocItem = {
  id: string
  title: string
  level: 2 | 3
}

export function MobileToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progresses, setProgresses] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Build headings from DOM
  useEffect(() => {
    const root = document.getElementById('article-content')
    if (!root) return
    const slugger = new GithubSlugger()
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2, h3'))
    const collected: TocItem[] = headings.map((h) => {
      if (!h.id) h.id = slugger.slug((h.textContent || '').trim())
      const level = (h.tagName.toLowerCase() === 'h2' ? 2 : 3) as 2 | 3
      return { id: h.id, title: (h.textContent || '').trim(), level }
    })
    setItems(collected)
    setActiveId(collected[0]?.id ?? null)

    // Observe active section
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    headings.forEach((h) => observer.observe(h))

    // Section progress based on viewport bottom
    const compute = () => {
      const starts = headings.map((h) => h.offsetTop)
      const lastIdx = headings.length - 1
      const rootTop = root.offsetTop
      const nextStart = (i: number) => (i < lastIdx ? starts[i + 1] : rootTop + root.offsetHeight)
      const viewBottom = window.scrollY + window.innerHeight
      const arr: number[] = []
      for (let i = 0; i < headings.length; i++) {
        const start = starts[i]
        const end = nextStart(i)
        const denom = Math.max(1, end - start)
        const p = (viewBottom - start) / denom
        arr[i] = Math.max(0, Math.min(1, p))
      }
      setProgresses(arr)
    }
    compute()
    const onScroll = () => compute()
    const onResize = () => compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Body scroll lock while drawer open
  useEffect(() => {
    const prev = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const hasToc = items.length > 0
  const nav = useMemo(() => items, [items])
  const activeIndex = useMemo(() => nav.findIndex((n) => n.id === activeId), [nav, activeId])
  const currentTitle = activeIndex >= 0 ? nav[activeIndex]?.title : nav[0]?.title
  const currentProgress = activeIndex >= 0 ? (progresses[activeIndex] ?? 0) : 0

  if (!hasToc) return null

  // Mini bar (visible on mobile only)
  return (
    <div className="block lg:hidden">
      {/* Mini bar */}
      <div
        className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={classNames(
            'pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full',
            'bg-white/90 dark:bg-slate-900/80 shadow-sm ring-1 ring-neutral-200/70 dark:ring-slate-700/60 backdrop-blur-sm',
            'px-3 py-2 text-left'
          )}
          aria-label="打开目录"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center">
            <CircularReadingProgress value={currentProgress} size={22} stroke={2} color="#E2231A" className="text-neutral-200 dark:text-slate-700" />
          </span>
          <span className="flex-1 truncate text-sm text-neutral-700 dark:text-slate-300">
            {currentTitle || '目录'}
          </span>
          <span className="text-neutral-500 dark:text-slate-400" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className={classNames(
              'fixed bottom-0 left-0 right-0 w-full max-h-[80vh] rounded-t-2xl',
              'bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10',
              'transition-transform duration-200'
            )}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-neutral-300/80 dark:bg-slate-600/60" aria-hidden />
            <div
              ref={listRef}
              className="mt-3 max-h-[calc(80vh-3rem)] overflow-auto px-4 pb-6"
            >
              {nav.map((item, idx) => {
                const isActive = item.id === activeId
                const onClick = (e: React.MouseEvent) => {
                  e.preventDefault()
                  const target = document.getElementById(item.id)
                  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setTimeout(() => setOpen(false), 100)
                }
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={onClick}
                    className={classNames(
                      'flex items-center gap-3 py-3 text-base text-neutral-600 dark:text-slate-300 border-b border-neutral-100 dark:border-slate-800',
                      { 'text-neutral-900 font-medium dark:text-slate-100': isActive, 'pl-4': item.level === 3 },
                    )}
                    aria-current={isActive ? 'location' : undefined}
                  >
                    <span className="relative inline-flex h-7 w-7 items-center justify-center">
                      <CircularReadingProgress value={progresses[idx] ?? 0} size={28} stroke={2} color="#E2231A" className="text-neutral-200 dark:text-slate-700" />
                      <span className="absolute text-[11px] text-neutral-500 dark:text-slate-400">{idx + 1}</span>
                    </span>
                    <span className="truncate">{item.title}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
