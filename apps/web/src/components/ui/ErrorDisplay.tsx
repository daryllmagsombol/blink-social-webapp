'use client';

export function ErrorDisplay({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-border bg-bg p-12 text-center">
      <span className="text-4xl mb-3">!</span>
      <p className="text-text-secondary font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
