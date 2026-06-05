'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { api, UPLOADS_URL } from '@/lib/api';
import { StoryViewer } from '@/components/story/StoryViewer';
import { StoryCreator } from '@/components/story/StoryCreator';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Heart, Bookmark, Plus, MessageCircle } from 'lucide-react';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { linkifyCaption } from '@/lib/linkify';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface StoryUser {
  user: { id: string; username: string; avatarUrl: string | null };
  stories: { id: string; imageUrl: string; createdAt: string; viewed: boolean }[];
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [storyViewer, setStoryViewer] = useState<{ stories: StoryUser[]; index: number } | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: Post[]; hasMore: boolean }>(`/feed?page=${pageNum}&limit=10`);
      setPosts((prev) => (pageNum === 1 ? res.data : [...prev, ...res.data]));
      setHasMore(res.hasMore);
      const liked = new Set<string>();
      await Promise.all(
        res.data.map(async (p) => {
          try {
            const { liked: isLiked } = await api.get<{ liked: boolean }>(
              `/posts/${p.id}/likes/check`,
            );
            if (isLiked) liked.add(p.id);
          } catch {}
        }),
      );
      setLikedPosts((prev) => {
        const n = new Set(prev);
        liked.forEach((id) => n.add(id));
        return n;
      });
      const saved = new Set<string>();
      await Promise.all(
        res.data.map(async (p) => {
          try {
            const { saved: isSaved } = await api.get<{ saved: boolean }>(
              `/posts/${p.id}/bookmark/check`,
            );
            if (isSaved) saved.add(p.id);
          } catch {}
        }),
      );
      setSavedPosts((prev) => {
        const n = new Set(prev);
        saved.forEach((id) => n.add(id));
        return n;
      });
    } catch {
      toast('Failed to load feed', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadStories = useCallback(() => {
    api.get<StoryUser[]>('/stories/following').then(setStoryUsers).catch(() => {});
  }, []);

  useEffect(() => {
    loadFeed(1);
    loadStories();
  }, [loadFeed, loadStories]);

  useEffect(() => {
    if (page === 1) return;
    loadFeed(page);
  }, [page, loadFeed]);

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

  const toggleLike = async (postId: string) => {
    setAnimatingHearts((prev) => new Set(prev).add(postId));
    setTimeout(() => {
      setAnimatingHearts((prev) => {
        const n = new Set(prev);
        n.delete(postId);
        return n;
      });
    }, 300);
    const liked = likedPosts.has(postId);
    try {
      if (liked) {
        await api.delete(`/posts/${postId}/likes`);
        setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      } else {
        await api.post(`/posts/${postId}/likes`);
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: liked ? p._count.likes - 1 : p._count.likes + 1 } }
            : p,
        ),
      );
    } catch {
      toast('Failed to update like', 'error');
    }
  };

  const toggleSave = async (postId: string) => {
    try {
      const { saved } = await api.post<{ saved: boolean }>(`/posts/${postId}/bookmark`);
      setSavedPosts((prev) => {
        const n = new Set(prev);
        saved ? n.add(postId) : n.delete(postId);
        return n;
      });
    } catch {
      toast('Failed to update bookmark', 'error');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 pb-32 md:pb-8">
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

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-32 md:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Feed</h1>
          {user && <p className="text-sm text-text-secondary">{user.displayName || user.username}</p>}
        </div>
      </div>

      <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {user && (
          <button
            onClick={() => setShowCreator(true)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div className="relative">
              <Avatar
                src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
                alt={user.username}
                size="lg"
                fallback={user.username[0]?.toUpperCase()}
              />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow">
                <Plus className="h-3 w-3" />
              </div>
            </div>
            <span className="w-16 truncate text-center text-xs text-text-secondary">Add story</span>
          </button>
        )}
        {storyUsers.map((su, i) => (
          <button
            key={su.user.id}
            onClick={() => setStoryViewer({ stories: storyUsers, index: i })}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div className={`rounded-full p-0.5 ${su.stories.some((s) => !s.viewed) ? 'bg-gradient-to-br from-primary to-brand' : 'bg-border'}`}>
              <Avatar
                src={su.user.avatarUrl ? `${UPLOADS_URL}${su.user.avatarUrl}` : undefined}
                alt={su.user.username}
                size="lg"
                fallback={su.user.username[0]?.toUpperCase()}
              />
            </div>
            <span className="w-16 truncate text-center text-xs text-text-secondary">{su.user.username}</span>
          </button>
        ))}
      </div>

      {storyViewer && (
        <StoryViewer
          stories={storyViewer.stories}
          initialIndex={storyViewer.index}
          onClose={() => setStoryViewer(null)}
        />
      )}

      {showCreator && (
        <StoryCreator
          onClose={() => setShowCreator(false)}
          onCreated={() => {
            setShowCreator(false);
            loadStories();
          }}
        />
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon="📸"
          title="Your feed is empty"
          description="Follow users to see their posts here."
          action={{ label: 'Explore', href: '/explore' }}
        />
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post, index) => (
              <Card key={post.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center gap-3 p-4">
                  <Link href={`/profile/${post.user.id}`}>
                    <Avatar
                      src={post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined}
                      alt={post.user.username}
                      size="sm"
                      fallback={post.user.username[0]?.toUpperCase()}
                    />
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${post.user.id}`} className="text-sm font-semibold hover:underline">
                      {post.user.username}
                    </Link>
                    <span className="text-xs text-text-secondary">· {timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <Link href={`/posts/${post.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-bg-secondary">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
                    />
                    <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-60px_40px_-20px_rgba(0,0,0,0.3)]" />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-5">
                    <Tooltip content={likedPosts.has(post.id) ? 'Unlike' : 'Like'}>
                    <button onClick={() => toggleLike(post.id)} className="transition-colors">
                      <Heart
                        className={`h-5 w-5 ${animatingHearts.has(post.id) ? 'animate-heart-beat' : ''} ${likedPosts.has(post.id) ? 'fill-accent text-accent' : 'text-text'}`}
                      />
                    </button>
                    </Tooltip>
                    <Link href={`/posts/${post.id}`} className="text-text transition-colors hover:text-text/80">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs">{post._count.comments}</span>
                      </div>
                    </Link>
                    <Tooltip content={savedPosts.has(post.id) ? 'Saved' : 'Save'}>
                    <button onClick={() => toggleSave(post.id)} className="ml-auto transition-colors">
                      <Bookmark className={`h-5 w-5 ${savedPosts.has(post.id) ? 'fill-primary text-primary' : 'text-text'}`} />
                    </button>
                    </Tooltip>
                  </div>
                  <p className="text-sm font-semibold">{post._count.likes} likes</p>
                  {post.caption && (
                    <p className="mt-1 text-sm">
                      <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline">
                        {post.user.username}
                      </Link>{' '}
                      {linkifyCaption(post.caption)}
                    </p>
                  )}
                  <Link href={`/posts/${post.id}`} className="mt-1 block text-xs text-text-secondary">
                    View all {post._count.comments} comments
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="mt-6 space-y-6">
              <PostSkeleton />
            </div>
          )}
        </>
      )}
    </div>
  );
}
