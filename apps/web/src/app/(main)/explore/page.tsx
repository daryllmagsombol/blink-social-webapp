'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Post {
  id: string;
  imageUrl: string;
  user: { id: string; username: string };
  _count: { likes: number; comments: number };
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    api
      .get<{ data: Post[]; hasMore: boolean }>(`/explore?page=${page}&limit=12`)
      .then((res) => {
        setPosts((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setHasMore(res.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <h1 className="mb-6 text-xl font-bold">Explore</h1>

      {posts.length === 0 ? (
        <div className="rounded border border-border bg-bg p-8 text-center">
          <p className="text-text-secondary">No posts yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group relative aspect-square bg-bg-secondary overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(http://localhost:4000${post.imageUrl})` }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-semibold">♥ {post._count.likes}</span>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="mx-auto mt-6 block rounded bg-primary px-6 py-2 text-sm text-white"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
