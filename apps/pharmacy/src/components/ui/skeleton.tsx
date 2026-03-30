import React from 'react';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 骨架屏组件
 * 用于在数据加载过程中显示占位符
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/70', className)}
      style={style}
    />
  );
}

/**
 * 卡片骨架屏组件
 * 用于在卡片数据加载过程中显示占位符
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <div className='space-y-3'>
        <Skeleton className='h-5 w-2/5' />
        <Skeleton className='h-4 w-4/5' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/5' />
        </div>
      </div>
    </div>
  );
}

/**
 * 表格骨架屏组件
 * 用于在表格数据加载过程中显示占位符
 */
export function TableSkeleton({
  className,
  rowCount = 5,
}: SkeletonProps & { rowCount?: number }) {
  return (
    <div className={cn('w-full', className)}>
      {/* 表头 */}
      <div className='flex border-b py-3'>
        <Skeleton className='h-5 w-1/4 mr-2' />
        <Skeleton className='h-5 w-1/4 mr-2' />
        <Skeleton className='h-5 w-1/4 mr-2' />
        <Skeleton className='h-5 w-1/4' />
      </div>

      {/* 表格行 */}
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={index} className='flex py-3 border-b'>
          <Skeleton className='h-4 w-1/4 mr-2' />
          <Skeleton className='h-4 w-1/4 mr-2' />
          <Skeleton className='h-4 w-1/4 mr-2' />
          <Skeleton className='h-4 w-1/4' />
        </div>
      ))}
    </div>
  );
}

/**
 * 表单骨架屏组件
 * 用于在表单数据加载过程中显示占位符
 */
export function FormSkeleton({
  className,
  fieldCount = 4,
}: SkeletonProps & { fieldCount?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fieldCount }).map((_, index) => (
        <div key={index} className='space-y-2'>
          <Skeleton className='h-4 w-1/4' />
          <Skeleton className='h-10 w-full' />
        </div>
      ))}
      <div className='flex justify-end pt-2'>
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}

/**
 * 统计卡片骨架屏组件
 * 用于在统计卡片数据加载过程中显示占位符
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <div className='flex justify-between items-center mb-3'>
        <Skeleton className='h-5 w-1/3' />
        <Skeleton className='h-5 w-5 rounded-full' />
      </div>
      <Skeleton className='h-8 w-1/2 mb-1' />
      <Skeleton className='h-3 w-1/4' />
    </div>
  );
}

/**
 * 图表骨架屏组件
 * 用于在图表数据加载过程中显示占位符
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-6 w-1/4' />
        <div className='flex space-x-2'>
          <Skeleton className='h-8 w-20 rounded-md' />
          <Skeleton className='h-8 w-20 rounded-md' />
        </div>
      </div>
      <div className='h-[200px] w-full flex items-end justify-between px-2'>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`w-[7%] rounded-t-md`}
            style={{
              height: `${Math.max(15, Math.floor(Math.random() * 100))}%`,
            }}
          />
        ))}
      </div>
      <div className='flex justify-between px-2'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-3 w-10' />
        ))}
      </div>
    </div>
  );
}
