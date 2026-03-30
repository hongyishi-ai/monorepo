import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  subtitle,
  className,
  onClick,
}: StatsCardProps) {
  return (
    <Card
      role={onClick ? 'button' : undefined}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary/40',
        className
      )}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 p-4'>
        <CardTitle className='text-[13px] sm:text-sm font-medium tracking-tight text-foreground'>
          {title}
        </CardTitle>
        {icon && (
          <div className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70 ring-1 ring-inset ring-slate-200'>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <div className='text-xl sm:text-2xl font-bold text-foreground'>
          {value}
        </div>
        {subtitle && (
          <p className='text-[11px] sm:text-xs text-muted-foreground mt-1'>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
