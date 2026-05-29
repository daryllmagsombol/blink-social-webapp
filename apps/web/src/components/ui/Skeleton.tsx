'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-bg-secondary ${className}`} />
  );
}

export function PostSkeleton() {
  return (
    <div className="rounded border border-border bg-bg">
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-5" />
        </div>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <GridSkeleton />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded p-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded p-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
