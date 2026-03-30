'use client'

import { useEffect, useRef, useState } from 'react'

export function useReadingProgress(targetId: string = 'article-content') {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const calc = () => {
      const el = document.getElementById(targetId)
      if (!el) {
        setProgress(0)
        return
      }
      const rectTop = el.getBoundingClientRect().top
      const start = rectTop + window.scrollY
      const end = start + el.offsetHeight - window.innerHeight
      const denom = Math.max(1, end - start)
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / denom))
      setProgress(p)
    }

    const onScroll = () => {
      if (raf.current) return
      raf.current = requestAnimationFrame(() => {
        raf.current = null
        calc()
      })
    }

    calc()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', calc)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', calc)
    }
  }, [targetId])

  return progress
}

