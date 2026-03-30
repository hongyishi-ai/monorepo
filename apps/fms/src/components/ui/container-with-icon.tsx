import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContainerWithIconProps {
  children: React.ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  iconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  iconOpacity?: number;
  className?: string;
  as?: React.ElementType;
  [key: string]: any; // 允许传递其他props到容器元素
}

const ContainerWithIcon: React.FC<ContainerWithIconProps> = ({
  children,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  iconSize = 'lg',
  iconPosition = 'top-right',
  iconOpacity = 0.08,
  className,
  as: Component = 'div',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const iconSizeValue = sizeClasses[iconSize];
  const iconPositionValue = positionClasses[iconPosition];

  return (
    <Component
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* 背景图标 */}
      <div 
        className={cn(
          'absolute pointer-events-none z-0',
          iconPositionValue
        )}
        style={{ opacity: iconOpacity }}
        aria-hidden="true"
      >
        <Icon 
          className={cn(
            iconSizeValue,
            iconColor
          )}
          aria-hidden="true"
        />
      </div>
      
      {/* 内容区域 */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

export default ContainerWithIcon; 
