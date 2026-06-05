'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const descriptionId = errorId || helperId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={descriptionId}
          className={cn(
            'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text outline-none transition-all duration-150 placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            error
              ? 'border-danger focus:border-danger'
              : 'border-border focus:border-text-secondary',
            className,
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
