'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export function ErrorDisplay({
  message = 'Something went wrong',
  onRetry,
  icon,
}: ErrorDisplayProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg p-12 text-center"
      role="alert"
    >
      {icon ?? (
        <div className="mb-3">
          <AlertCircle className="h-10 w-10 text-danger" />
        </div>
      )}
      <p className="font-medium text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
