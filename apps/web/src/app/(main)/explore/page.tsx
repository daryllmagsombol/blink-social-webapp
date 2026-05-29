'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Post {
  id: string;
  imageUrl: string;
  user: { id: string; username: string };
  _count: { likes: number; comments: number };
}

interface TrendingTag {
  id: string;
  name: string;
  _count: { posts: number };
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPosts = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: Post[]; hasMore: boolean }>(`/explore?page=${pageNum}&limit=12`);
      setPosts((prev) => (pageNum === 1 ? res.data : [...prev, ...res.data]));
      setHasMore(res.hasMore);
    } catch {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
    api.get<TrendingTag[]>('/tags/trending').then(setTrending).catch(() => {}).finally(() => setTrendingLoading(false));
  }, []);

  useEffect(() => {
    if (page === 1) return;
    loadPosts(page);
  }, [page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
        <div className="mb-6 h-7 w-24 animate-pulse rounded bg-bg-secondary" />
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <h1 className="mb-6 text-xl font-bold">Explore</h1>

      {trending.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">Trending tags</h2>
          <div className="flex flex-wrap gap-2">
            {trending.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.name}`}
                className="rounded-full bg-bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag.name}
                <span className="ml-1 text-xs text-text-secondary">{tag._count.posts}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState icon="🔍" title="No posts yet" description="Be the first to share something!" />
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
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="mt-4">
              <GridSkeleton count={6} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
