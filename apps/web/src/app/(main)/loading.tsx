import { PostSkeleton } from '@/components/ui/Skeleton';

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      <div className="mb-6">
        <div className="h-7 w-16 animate-pulse rounded bg-bg-secondary" />
      </div>
      <div className="space-y-6">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}
