'use client';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-20 px-4">
      <div className="flex flex-col items-center justify-center rounded border border-border bg-bg p-12 text-center">
        <span className="text-4xl mb-3">!</span>
        <p className="text-text-secondary font-medium">Something went wrong</p>
        <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
