'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  targetId?: string
  height?: number
  color?: string
  placement?: 'top' | 'bottom'
}

export default function ReadingProgressBar({
  targetId = 'article-content',
  height = 3,
  color = '#E2231A',
  placement = 'top',
}: Props) {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const calc = () => {
      const el = document.getElementById(targetId)
      if (!el) {
        setProgress(0)
        return
      }
      const start = el.getBoundingClientRect().top + window.scrollY
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

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        insetInlineStart: 0,
        insetBlockStart: placement === 'top' ? 0 : undefined,
        insetBlockEnd: placement === 'bottom' ? 0 : undefined,
        height,
        width: '100%',
        background: 'transparent',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: color,
          transition: 'width 80ms linear',
        }}
      />
    </div>
  )
}
