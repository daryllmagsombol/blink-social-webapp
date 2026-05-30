'use client';

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
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg p-12 text-center">
      {icon ?? <span className="mb-3 text-4xl">!</span>}
      <p className="font-medium text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
