import * as React from 'react';

import { cn } from '../../lib/utils';

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'h-6 w-6 shrink-0 border-2 border-foreground bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{ accentColor: 'hsl(var(--primary))', ...style }}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
