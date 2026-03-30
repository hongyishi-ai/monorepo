import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg border border-muted bg-card',
        className
      )}
    >
      {icon && <div className='mb-3 text-muted-foreground'>{icon}</div>}
      {title && (
        <h3 className='text-sm font-medium tracking-tight text-foreground'>
          {title}
        </h3>
      )}
      {description && (
        <p className='mt-1 text-xs text-muted-foreground max-w-[28ch]'>
          {description}
        </p>
      )}
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}

export default EmptyState;
