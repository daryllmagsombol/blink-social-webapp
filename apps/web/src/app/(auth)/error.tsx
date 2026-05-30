'use client';

import { Button } from '@/components/ui/Button';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm rounded border border-border bg-bg p-8 text-center">
        <span className="text-3xl mb-3 block">!</span>
        <p className="text-sm text-text-secondary">{error.message || 'Something went wrong'}</p>
        <Button onClick={reset} size="sm" className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
