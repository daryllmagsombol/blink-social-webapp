'use client';

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
