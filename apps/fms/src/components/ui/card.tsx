import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

// 新增：带背景图标装饰的Card组件
interface CardWithIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }>
  iconClassName?: string
  iconColor?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | string
  iconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | string
  iconOpacity?: number
  backgroundImage?: string
  gradientOverlay?: string
}

const CardWithIcon = React.forwardRef<
  HTMLDivElement,
  CardWithIconProps
>(({ 
  className, 
  icon: Icon, 
  iconClassName, 
  iconColor, 
  iconSize = "lg",
  iconPosition = "bottom-right",
  iconOpacity = 0.06,
  backgroundImage,
  gradientOverlay,
  children, 
  ...props 
}, ref) => {
  // 预设图标大小
  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  // 预设位置
  const positionMap = {
    'top-left': "-top-4 -left-4",
    'top-right': "-top-4 -right-4", 
    'bottom-left': "-bottom-4 -left-4",
    'bottom-right': "-bottom-6 -right-6"
  };

  const finalIconSize = sizeMap[iconSize as keyof typeof sizeMap] || iconSize;
  const finalIconPosition = positionMap[iconPosition as keyof typeof positionMap] || iconPosition;

  // 如果没有指定颜色，使用基于透明度的默认颜色
  const finalIconColor = iconColor || `text-muted-foreground`;

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden",
        className
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      {...props}
    >
      {/* 背景图片渐变遮罩 */}
      {backgroundImage && gradientOverlay && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: gradientOverlay }}
        />
      )}
      {/* 背景装饰图标 */}
      {Icon && (
        <div 
          className={cn("absolute pointer-events-none", finalIconPosition)}
          style={{ opacity: iconOpacity }}
        >
          <Icon 
            className={cn(
              "transform rotate-12",
              finalIconSize,
              finalIconColor,
              iconClassName
            )} 
          />
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
})
CardWithIcon.displayName = "CardWithIcon"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardWithIcon, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
