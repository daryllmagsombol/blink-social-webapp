'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { PostGridCard } from '@/components/ui/PostGridCard';


interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

export default function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useInfiniteScroll(hasMore, loadingMore, () => setPage((p) => p + 1));
  const [init, setInit] = useState(false);

  const loadBookmarks = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: Post[]; hasMore: boolean }>(`/bookmarks?page=${pageNum}&limit=12`);
      setPosts((prev) => (pageNum === 1 ? res.data : [...prev, ...res.data]));
      setHasMore(res.hasMore);
    } catch {
      toast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInit(true);
    }
  };

  useEffect(() => {
    loadBookmarks(1);
  }, []);

  useEffect(() => {
    if (page === 1) return;
    loadBookmarks(page);
  }, [page]);


  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6 h-7 w-24 animate-pulse rounded bg-bg-secondary" />
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 animate-fade-in">
      <h1 className="mb-6 text-xl font-bold">Saved</h1>

      {posts.length === 0 ? (
        <EmptyState icon="🔖" title="No saved posts" description="Tap the bookmark icon on posts to save them here." action={{ label: 'Explore', href: '/explore' }} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post, index) => (
              <PostGridCard
                key={post.id}
                post={post}
                index={index}
                showComments={false}
              />
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
