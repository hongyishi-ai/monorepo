import React from 'react';
import { Button } from './button';
import { HelpCircle } from 'lucide-react';
import { useProductTour } from '@/hooks/useProductTour';
import { cn } from '@/lib/utils';

interface TourHelpButtonProps {
  variant?: 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
  position?: 'fixed' | 'inline';
}

/**
 * 首页产品引导帮助按钮组件
 * 仅在首页使用，点击后启动首页的产品引导
 */
export const TourHelpButton: React.FC<TourHelpButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  className,
  showText = false,
  position = 'inline'
}) => {
  const { startTourManually } = useProductTour();

  const handleClick = () => {
    startTourManually();
  };

  const buttonClass = cn(
    'text-muted-foreground hover:text-foreground transition-colors',
    position === 'fixed' && 'fixed bottom-4 right-4 z-50 shadow-lg',
    className
  );

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={buttonClass}
      title="产品引导"
    >
      <HelpCircle className="w-4 h-4" />
      {showText && <span className="ml-2">产品引导</span>}
    </Button>
  );
};

export default TourHelpButton;