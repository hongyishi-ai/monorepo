import { cva } from 'class-variance-authority';

/**
 * 迪特·拉姆斯风格按钮
 * 原则：功能主义、无渐变、高对比度、简洁
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border',
  {
    variants: {
      variant: {
        /* 默认按钮 - 信号橙填充，哑光黑文字 */
        default:
          'bg-primary text-primary-foreground hover:bg-primary/95 border-primary',
        /* 销毁按钮 - 纯红色边框 */
        destructive:
          'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground',
        /* 轮廓按钮 - 哑光黑边框和文字 */
        outline:
          'border-foreground bg-background text-foreground hover:bg-foreground hover:text-background',
        /* 次级按钮 - 浅灰填充 */
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        /* 幽灵按钮 - 仅文字 */
        ghost: 'hover:bg-accent text-foreground border-transparent',
        /* 链接按钮 - 信号橙文字 */
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
        /* 成功按钮 - 深绿边框 */
        success:
          'border-success text-success hover:bg-success hover:text-success-foreground',
        /* 警告按钮 - 琥珀色边框 */
        warning:
          'border-warning text-warning hover:bg-warning hover:text-warning-foreground',
        /* 错误按钮 - 纯红边框 */
        error:
          'border-error text-error hover:bg-error hover:text-error-foreground',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
