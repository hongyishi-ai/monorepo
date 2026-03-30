import { AlertCircle, CheckCircle, FileUp, Upload } from 'lucide-react';
import * as React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FileUploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onError'> {
  onFileSelected?: (file: File) => void;
  onError?: (error: Error) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  label?: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'compact';
  error?: string;
  success?: string;
}

/**
 * 文件上传组件
 * 支持拖放和点击上传
 */
export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      onFileSelected,
      onError,
      acceptedFileTypes = '.xlsx,.xls,.csv',
      maxFileSizeMB = 10,
      label = '选择文件或拖放到此处',
      buttonText = '选择文件',
      className,
      variant = 'default',
      error,
      success,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

    // 合并外部传入的 ref 和内部的 ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleDragEnter = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      []
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      []
    );

    const handleDragOver = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
          setIsDragging(true);
        }
      },
      [isDragging]
    );

    const validateFile = React.useCallback(
      (file: File): { valid: boolean; error?: string } => {
        // 检查文件类型
        const fileType = file.name.split('.').pop()?.toLowerCase();
        const validTypes = acceptedFileTypes
          .split(',')
          .map(type => (type.startsWith('.') ? type.substring(1) : type));

        if (!fileType || !validTypes.includes(fileType)) {
          return {
            valid: false,
            error: `不支持的文件类型。请上传 ${acceptedFileTypes} 格式的文件。`,
          };
        }

        // 检查文件大小
        if (file.size > maxSizeBytes) {
          return {
            valid: false,
            error: `文件过大。最大允许 ${maxFileSizeMB}MB。`,
          };
        }

        return { valid: true };
      },
      [acceptedFileTypes, maxSizeBytes, maxFileSizeMB]
    );

    const processFile = React.useCallback(
      (file: File) => {
        const validation = validateFile(file);

        if (!validation.valid) {
          if (validation.error && onError) {
            onError(new Error(validation.error));
          }
          return;
        }

        setSelectedFile(file);
        if (onFileSelected) {
          onFileSelected(file);
        }
      },
      [validateFile, onError, onFileSelected]
    );

    const handleDrop = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          processFile(file);
        }
      },
      [processFile]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        processFile(file);
      }
    };

    const handleButtonClick = () => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    const clearFile = () => {
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed transition-colors',
            {
              'border-primary bg-primary/5': isDragging,
              'border-input hover:border-primary/50': !isDragging,
              'p-10': variant === 'default',
              'p-4': variant === 'compact',
              'border-destructive/50 bg-destructive/5': error,
              'border-success/50 bg-success/5': success && !error,
            }
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Input
            type='file'
            ref={inputRef}
            className='hidden'
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            {...props}
          />

          <div className='flex flex-col items-center justify-center text-center'>
            {variant === 'default' && (
              <Upload
                className={cn('h-10 w-10 mb-2', {
                  'text-primary': isDragging,
                  'text-muted-foreground': !isDragging && !error && !success,
                  'text-destructive': error,
                  'text-success': success && !error,
                })}
              />
            )}

            {variant !== 'compact' && (
              <p className='mb-2 text-sm text-muted-foreground'>
                {selectedFile ? `已选择: ${selectedFile.name}` : label}
              </p>
            )}

            <div className='flex gap-2'>
              <Button
                type='button'
                variant={
                  error ? 'destructive' : success ? 'success' : 'default'
                }
                size='sm'
                onClick={handleButtonClick}
              >
                <FileUp className='mr-2 h-4 w-4' />
                {buttonText}
              </Button>

              {selectedFile && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={clearFile}
                >
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant='destructive' className='mt-2'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>上传错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && !error && (
          <Alert variant='success' className='mt-2'>
            <CheckCircle className='h-4 w-4' />
            <AlertTitle>上传成功</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
