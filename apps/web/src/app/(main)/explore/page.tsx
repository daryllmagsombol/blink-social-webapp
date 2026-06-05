'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { GridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

function MatIcon({ icon, filled = false, className = '' }: { icon: string; filled?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined text-[22px] ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {icon}
    </span>
  );
}

interface Post {
  id: string;
  imageUrl: string;
  user: { id: string; username: string };
  _count: { likes: number; comments: number };
}

const categories = [
  'For You',
  'Travel',
  'Architecture',
  'Food',
  'Style',
  'Art',
  'Nature',
  'Tech',
  'Music',
  'Sports',
];

type GridItemSize = 'small' | 'medium' | 'tall' | 'featured';

interface GridItem {
  post: Post;
  size: GridItemSize;
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('For You');
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

  // Create varied layout pattern
  const gridItems: GridItem[] = useMemo(() => {
    const pattern: GridItemSize[] = [
      'small', 'small', 'tall',
      'small', 'featured',
      'tall', 'small', 'small',
      'small', 'small', 'medium',
      'medium', 'small', 'small',
    ];

    return posts.map((post, i) => ({
      post,
      size: pattern[i % pattern.length],
    }));
  }, [posts]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[935px] py-4 px-4 pb-20">
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md mx-auto rounded-lg" />
        </div>
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
            ))}
          </div>
        </div>
        <GridSkeleton />
      </div>
    );
  }

  const sizeClasses: Record<GridItemSize, string> = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    tall: 'col-span-1 row-span-2',
    featured: 'col-span-2 row-span-2',
  };

  return (
    <div className="mx-auto max-w-[935px] py-4 px-4 pb-20 animate-fade-in">
      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative mx-auto max-w-md">
          <MatIcon
            icon="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]"
          />
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-lg bg-bg-secondary border-0 py-2.5 pl-10 pr-4 text-[13px] outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text border border-border'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Dynamic Grid */}
      {gridItems.length === 0 ? (
        <EmptyState icon="🔍" title="No posts yet" description="Be the first to share something!" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[3px] md:gap-1">
            {gridItems.map((item, index) => {
              const { post, size } = item;
              const isTallOrFeatured = size === 'tall' || size === 'featured';

              return (
                <Link
                  key={`${post.id}-${index}`}
                  href={`/posts/${post.id}`}
                  className={`group relative bg-bg-secondary overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
                    size === 'featured'
                      ? 'col-span-2 row-span-2'
                      : size === 'tall'
                        ? 'col-span-1 row-span-2'
                        : size === 'medium'
                          ? 'col-span-2 row-span-1 md:col-span-2 md:row-span-1'
                          : 'col-span-1 row-span-1'
                  }`}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
                  />

                  {/* Media type indicators */}
                  {index % 5 === 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <span
                        className="material-symbols-outlined text-white text-[20px] drop-shadow-md"
                        style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                      >
                        play_circle
                      </span>
                    </div>
                  )}
                  {index % 7 === 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <span
                        className="material-symbols-outlined text-white text-[20px] drop-shadow-md"
                        style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                      >
                        collections
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="flex items-center gap-1.5 text-white text-[13px] font-semibold">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                      >
                        favorite
                      </span>
                      {post._count.likes}
                    </span>
                    <span className="flex items-center gap-1.5 text-white text-[13px] font-semibold">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                      >
                        chat_bubble
                      </span>
                      {post._count.comments}
                    </span>
                  </div>
                </Link>
              );
            })}
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
