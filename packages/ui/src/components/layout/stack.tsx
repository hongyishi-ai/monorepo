import * as React from 'react';
import { cn } from '../../lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: '1' | '2' | '3' | '4' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const gapMap = { '1': 'gap-1', '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '6': 'gap-6', '8': 'gap-8' };

export function Stack({
  className,
  direction = 'col',
  gap = '4',
  align = 'stretch',
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        `items-${align}`,
        gapMap[gap],
        className
      )}
      {...props}
    />
  );
}
