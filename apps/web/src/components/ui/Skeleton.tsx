'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-shimmer bg-[length:200%_100%]',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rectangular' && 'rounded',
        className,
      )}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-bg">
      <div className="flex items-center gap-3 p-4">
        <Skeleton variant="circular" className="h-8 w-8" />
        <Skeleton variant="text" className="h-4 w-24" />
      </div>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-5" />
        </div>
        <Skeleton variant="text" className="w-16" />
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
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
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <div className="mb-8 flex items-center gap-6">
        <Skeleton variant="circular" className="h-20 w-20 shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" className="h-6 w-32" />
          <div className="flex gap-6">
            <Skeleton variant="text" className="h-4 w-16" />
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="h-4 w-20" />
          </div>
          <Skeleton variant="text" className="h-4 w-48" />
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
          <Skeleton variant="circular" className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="text" className="h-3 w-3/4" />
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
          <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="h-4 w-48" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
