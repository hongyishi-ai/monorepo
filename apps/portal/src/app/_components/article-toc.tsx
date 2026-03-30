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

export function ArticleToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progresses, setProgresses] = useState<number[]>([])
  const listRef = useRef<HTMLElement | null>(null)

  // Build TOC from DOM headings, ensure ids exist
  useEffect(() => {
    const root = document.getElementById('article-content')
    if (!root) return
    const slugger = new GithubSlugger()
    // Note: using CSS modules means the class name is hashed, so don't rely on `.markdown`.
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2, h3'))

    const collected: TocItem[] = headings.map((h) => {
      if (!h.id) {
        const base = (h.textContent || '').trim()
        h.id = slugger.slug(base)
      }
      const level = (h.tagName.toLowerCase() === 'h2' ? 2 : 3) as 2 | 3
      return { id: h.id, title: (h.textContent || '').trim(), level }
    })
    setItems(collected)
    setActiveId(collected[0]?.id ?? null)

    // Observe headings for active highlight
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      {
        rootMargin: '-40% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )
    headings.forEach((h) => observer.observe(h))
    const computeProgresses = () => {
      const root = document.getElementById('article-content')
      if (!root) return
      const starts = headings.map((h) => h.offsetTop)
      const rootTop = root.offsetTop
      const lastIdx = headings.length - 1
      const arr: number[] = []
      const nextStart = (i: number) => (i < lastIdx ? starts[i + 1] : rootTop + root.offsetHeight)
      const viewBottom = window.scrollY + window.innerHeight
      for (let i = 0; i < headings.length; i++) {
        const start = starts[i]
        const end = nextStart(i)
        const denom = Math.max(1, end - start)
        // Start counting when the section top starts entering from the bottom edge
        const p = (viewBottom - start) / denom
        arr[i] = Math.max(0, Math.min(1, p))
      }
      setProgresses(arr)
    }
    const onScroll = () => computeProgresses()
    const onResize = () => computeProgresses()
    computeProgresses()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const hasToc = items.length > 0
  const nav = useMemo(() => items, [items])

  // progresses are updated client-side only

  // Keep active item aligned near the top for a synced feeling
  useEffect(() => {
    if (!activeId || !listRef.current) return
    const container = listRef.current
    const el = container.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`)
    if (!el) return
    const idx = nav.findIndex((i) => i.id === activeId)
    const marginTop = container.clientHeight * 0.2
    let desiredTop = Math.max(0, el.offsetTop - marginTop)
    if (idx >= nav.length - 2) {
      desiredTop = Math.max(0, container.scrollHeight - container.clientHeight)
    }
    container.scrollTo({ top: desiredTop, behavior: 'smooth' })
  }, [activeId, nav])

  if (!hasToc) return null

  return (
    <aside aria-label="目录" className="hidden lg:block w-64 xl:w-72">
      <div className="sticky top-32 space-y-6">
        <div>
          {/* 简约设计：移除可见标题，仅保留列表 */}
          <nav
            ref={listRef}
            className="mt-4 max-h-[calc(100vh-8rem)] overflow-auto pr-2 space-y-1 border-l border-neutral-200/70 pl-4 pb-24 dark:border-slate-700/60"
          >
            {nav.map((item, idx) => {
              const isActive = item.id === activeId
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={classNames(
                    'flex items-center gap-3 py-2 text-sm leading-6 text-neutral-500 transition-colors duration-200 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-slate-100',
                    {
                      'text-neutral-900 font-medium dark:text-slate-100': isActive,
                      'pl-4': item.level === 3,
                    },
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
          </nav>
        </div>
      </div>
    </aside>
  )
}
