'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

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
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold">#{tag}</h1>
        <p className="text-sm text-text-secondary">{posts.length} posts</p>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon="🏷️" title="No posts with this tag" description="Be the first to use #tag!" />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group relative aspect-square bg-bg-secondary overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-semibold">♥ {post._count.likes}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
