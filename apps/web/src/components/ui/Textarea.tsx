'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={cn(
            'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text outline-none transition-all duration-150 placeholder:text-text-secondary resize-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            error
              ? 'border-danger focus:border-danger'
              : 'border-border focus:border-text-secondary',
            className,
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
