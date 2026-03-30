import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface IconProps {
  as: LucideIcon;
  size?: number;
  className?: string;
}

export function Icon({ as: Component, size = 20, className }: IconProps) {
  return <Component className={cn(className)} size={size} strokeWidth={2} />;
}

export default Icon;
