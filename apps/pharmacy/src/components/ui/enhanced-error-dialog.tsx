import { AlertCircle, Info, XCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ErrorDetail {
  field?: string;
  message: string;
  suggestion?: string;
}

interface EnhancedErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  errorType?: 'error' | 'warning' | 'info';
  mainMessage: string;
  details?: ErrorDetail[];
  suggestions?: string[];
  onRetry?: () => void;
  retryLabel?: string;
}

export function EnhancedErrorDialog({
  isOpen,
  onClose,
  title,
  errorType = 'error',
  mainMessage,
  details = [],
  suggestions = [],
  onRetry,
  retryLabel = '重试',
}: EnhancedErrorDialogProps) {
  const getIcon = () => {
    switch (errorType) {
      case 'warning':
        return <AlertCircle className='h-5 w-5 text-amber-500' />;
      case 'info':
        return <Info className='h-5 w-5 text-blue-500' />;
      default:
        return <XCircle className='h-5 w-5 text-red-500' />;
    }
  };

  const getDefaultTitle = () => {
    switch (errorType) {
      case 'warning':
        return '操作警告';
      case 'info':
        return '操作信息';
      default:
        return '操作失败';
    }
  };

  const getVariantClass = () => {
    switch (errorType) {
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            {getIcon()}
            {title || getDefaultTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-4'>
              <p className='text-sm text-foreground font-medium'>
                {mainMessage}
              </p>

              {details.length > 0 && (
                <div className={`p-3 rounded-lg border ${getVariantClass()}`}>
                  <h4 className='text-sm font-medium mb-2'>详细信息:</h4>
                  <div className='space-y-2'>
                    {details.map((detail, index) => (
                      <div key={index} className='text-sm'>
                        {detail.field && (
                          <Badge variant='outline' className='mr-2 text-xs'>
                            {detail.field}
                          </Badge>
                        )}
                        <span className='text-muted-foreground'>
                          {detail.message}
                        </span>
                        {detail.suggestion && (
                          <div className='mt-1 text-xs text-blue-600 italic'>
                            建议: {detail.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className='bg-blue-50 border border-blue-200 p-3 rounded-lg'>
                  <h4 className='text-sm font-medium mb-2 text-blue-800'>
                    解决建议:
                  </h4>
                  <ul className='text-sm text-blue-700 space-y-1'>
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className='flex items-start gap-2'>
                        <span className='text-blue-500 mt-0.5'>•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='gap-2'>
          <AlertDialogAction
            onClick={onClose}
            className='bg-secondary text-secondary-foreground hover:bg-secondary/80'
          >
            确定
          </AlertDialogAction>
          {onRetry && (
            <AlertDialogAction onClick={onRetry}>
              {retryLabel}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
