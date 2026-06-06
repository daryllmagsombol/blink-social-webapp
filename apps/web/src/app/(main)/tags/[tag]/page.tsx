'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostGridCard } from '@/components/ui/PostGridCard';

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: Post[] }>(`/tags/${tag}/posts`)
      .then((res) => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tag]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-bg-secondary" />
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20 animate-fade-in">
      <div className="mb-6 rounded-lg border border-border bg-bg p-4">
        <h1 className="text-xl font-bold">#{tag}</h1>
        <p className="text-sm text-text-secondary mt-1">{posts.length} posts</p>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon="🏷️" title="No posts with this tag" description="Be the first to use #tag!" />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post, index) => (
            <PostGridCard
              key={post.id}
              post={post}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
