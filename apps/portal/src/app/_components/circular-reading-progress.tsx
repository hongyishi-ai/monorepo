'use client'

import { useMemo } from 'react'
import { useReadingProgress } from './use-reading-progress'

type Props = {
  targetId?: string
  size?: number
  stroke?: number
  color?: string
  value?: number // Optional external progress [0,1]
  className?: string
}

export default function CircularReadingProgress({
  targetId = 'article-content',
  size = 36,
  stroke = 3,
  color = '#E2231A',
  value,
  className,
}: Props) {
  const innerProgress = useReadingProgress(targetId)
  const progress = typeof value === 'number' ? Math.max(0, Math.min(1, value)) : innerProgress
  const { radius, circumference, offset } = useMemo(() => {
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - progress)
    return { radius, circumference, offset }
  }, [size, stroke, progress])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke="currentColor"
        className="text-neutral-200 dark:text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 80ms linear' }}
      />
    </svg>
  )
}
