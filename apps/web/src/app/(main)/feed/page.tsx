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
import { PostSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { linkifyCaption } from '@/lib/linkify';

function MatIcon({
  icon,
  filled = false,
  className = '',
}: {
  icon: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined text-[22px] ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {icon}
    </span>
  );
}

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

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  _count?: { followers: number };
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
  const [storyViewer, setStoryViewer] = useState<{ stories: StoryUser[]; index: number } | null>(
    null,
  );
  const [showCreator, setShowCreator] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComments, setSubmittingComments] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: Post[]; hasMore: boolean }>(
        `/feed?page=${pageNum}&limit=10`,
      );
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
    api
      .get<StoryUser[]>('/stories/following')
      .then(setStoryUsers)
      .catch(() => {});
  }, []);

  const loadSuggestions = useCallback(() => {
    api
      .get<{ data: SuggestedUser[] }>('/users/suggestions?limit=5')
      .then((res) => setSuggestedUsers(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFeed(1);
    loadStories();
    loadSuggestions();
  }, [loadFeed, loadStories, loadSuggestions]);

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
        setLikedPosts((prev) => {
          const n = new Set(prev);
          n.delete(postId);
          return n;
        });
      } else {
        await api.post(`/posts/${postId}/likes`);
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                _count: { ...p._count, likes: liked ? p._count.likes - 1 : p._count.likes + 1 },
              }
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

  const submitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setSubmittingComments((prev) => new Set(prev).add(postId));
    try {
      await api.post(`/posts/${postId}/comments`, { content: text });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p,
        ),
      );
      toast('Comment added', 'success');
    } catch {
      toast('Failed to add comment', 'error');
    } finally {
      setSubmittingComments((prev) => {
        const n = new Set(prev);
        n.delete(postId);
        return n;
      });
    }
  };

  const followSuggestion = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setFollowingUsers((prev) => new Set(prev).add(userId));
      toast('Followed', 'success');
    } catch {
      toast('Failed to follow', 'error');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[630px] px-4 py-4 pb-32 lg:pb-4">
        <div className="mb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1">
                <div className="h-16 w-16 animate-pulse rounded-full bg-bg-secondary" />
                <div className="h-3 w-12 animate-pulse rounded bg-bg-secondary" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/* Feed Column */}
      <div className="w-full max-w-[630px] px-4 py-4 pb-32 lg:pb-4 lg:mr-[320px]">
        {/* Stories Bar */}
        <div className="mb-5 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {/* Add Story */}
          {user && (
            <button
              onClick={() => setShowCreator(true)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-accent via-brand to-primary p-[2px]">
                  <div className="rounded-full bg-white p-[2px]">
                    <Avatar
                      src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
                      alt={user.username}
                      size="md"
                      fallback={user.username[0]?.toUpperCase()}
                    />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-md">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </div>
              </div>
              <span className="w-[68px] truncate text-center text-[11px] text-text-secondary font-medium">
                Your Story
              </span>
            </button>
          )}

          {/* Story Rings */}
          {storyUsers.map((su, i) => {
            const hasUnviewed = su.stories.some((s) => !s.viewed);
            return (
              <button
                key={su.user.id}
                onClick={() => setStoryViewer({ stories: storyUsers, index: i })}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <div
                  className={`rounded-full p-[2px] ${
                    hasUnviewed
                      ? 'bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]'
                      : 'bg-border'
                  }`}
                >
                  <div className="rounded-full bg-white p-[2px]">
                    <Avatar
                      src={su.user.avatarUrl ? `${UPLOADS_URL}${su.user.avatarUrl}` : undefined}
                      alt={su.user.username}
                      size="md"
                      fallback={su.user.username[0]?.toUpperCase()}
                    />
                  </div>
                </div>
                <span className="w-[68px] truncate text-center text-[11px] text-text-secondary font-medium">
                  {su.user.username}
                </span>
              </button>
            );
          })}
        </div>

        {/* Story Viewer */}
        {storyViewer && (
          <StoryViewer
            stories={storyViewer.stories}
            initialIndex={storyViewer.index}
            onClose={() => setStoryViewer(null)}
          />
        )}

        {/* Story Creator */}
        {showCreator && (
          <StoryCreator
            onClose={() => setShowCreator(false)}
            onCreated={() => {
              setShowCreator(false);
              loadStories();
            }}
          />
        )}

        {/* Feed Posts */}
        {posts.length === 0 ? (
          <EmptyState
            icon="📸"
            title="Your feed is empty"
            description="Follow users to see their posts here."
            action={{ label: 'Explore', href: '/explore' }}
          />
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                    className="rounded-xl border border-border bg-bg animate-fade-in-up overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user.id}`}>
                        <Avatar
                          src={
                            post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined
                          }
                          alt={post.user.username}
                          size="sm"
                          fallback={post.user.username[0]?.toUpperCase()}
                        />
                      </Link>
                      <div>
                        <Link
                          href={`/profile/${post.user.id}`}
                          className="text-[13px] font-semibold text-text hover:underline leading-[18px]"
                        >
                          {post.user.username}
                        </Link>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide leading-[14px]">
                          {timeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button className="text-text-secondary hover:text-text transition-colors">
                      <MatIcon icon="more_horiz" />
                    </button>
                  </div>

                  {/* Post Image (double-tap to like) */}
                  <Link href={`/posts/${post.id}`}>
                    <div className="relative aspect-square bg-bg-secondary">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
                      />
                    </div>
                  </Link>

                  {/* Post Actions */}
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like */}
                        <button
                          onClick={() => toggleLike(post.id)}
                          className="transition-all duration-150 active:scale-125"
                        >
                          <span
                            className={`material-symbols-outlined text-[26px] transition-all duration-150 ${
                              animatingHearts.has(post.id) ? 'animate-heart-beat' : ''
                            } ${likedPosts.has(post.id) ? 'text-[#ED4956]' : 'text-text'}`}
                            style={{
                              fontVariationSettings: `'FILL' ${likedPosts.has(post.id) ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                            }}
                          >
                            {likedPosts.has(post.id) ? 'favorite' : 'favorite'}
                          </span>
                        </button>

                        {/* Comment */}
                        <Link
                          href={`/posts/${post.id}`}
                          className="transition-all duration-150 hover:scale-110"
                        >
                          <span
                            className="material-symbols-outlined text-[26px] text-text"
                            style={{
                              fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                            }}
                          >
                            chat_bubble
                          </span>
                        </Link>

                        {/* Share */}
                        <button className="transition-all duration-150 hover:scale-110">
                          <span
                            className="material-symbols-outlined text-[26px] text-text"
                            style={{
                              fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                            }}
                          >
                            send
                          </span>
                        </button>
                      </div>

                      {/* Bookmark */}
                      <button
                        onClick={() => toggleSave(post.id)}
                        className="transition-all duration-150 hover:scale-110"
                      >
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{
                            fontVariationSettings: `'FILL' ${savedPosts.has(post.id) ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                          }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>

                    {/* Like Count */}
                    <p className="mt-1 text-[13px] font-semibold text-text">
                      {post._count.likes.toLocaleString()} likes
                    </p>

                    {/* Caption */}
                    {post.caption && (
                      <p className="mt-0.5 text-[13px] leading-[18px]">
                        <Link
                          href={`/profile/${post.user.id}`}
                          className="font-semibold text-text hover:underline"
                        >
                          {post.user.username}
                        </Link>{' '}
                        <span className="text-text">{linkifyCaption(post.caption)}</span>
                      </p>
                    )}

                    {/* View Comments */}
                    {post._count.comments > 0 && (
                      <Link
                        href={`/posts/${post.id}`}
                        className="mt-0.5 block text-[12px] text-text-secondary hover:underline"
                      >
                        View all {post._count.comments} comments
                      </Link>
                    )}

                    {/* Time Ago */}
                    <p className="mt-0.5 text-[10px] text-text-secondary uppercase tracking-wide">
                      {timeAgo(post.createdAt)}
                    </p>
                  </div>

                  {/* Comment Input */}
                  {user && (
                    <form
                      onSubmit={(e) => submitComment(post.id, e)}
                      className="flex items-center border-t border-border px-4 py-2.5"
                    >
                      <button
                        type="button"
                        className="mr-2 text-text-secondary hover:text-text transition-colors"
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{
                            fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                          }}
                        >
                          mood
                        </span>
                      </button>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        maxLength={500}
                        className="flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-text-secondary"
                      />
                      <button
                        type="submit"
                        disabled={
                          !commentInputs[post.id]?.trim() || submittingComments.has(post.id)
                        }
                        className="text-[13px] font-semibold text-primary disabled:opacity-40 hover:text-primary-dark transition-colors"
                      >
                        {submittingComments.has(post.id) ? '...' : 'Post'}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="mt-4 space-y-4">
                <PostSkeleton />
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Sidebar - Suggestions */}
      <aside className="fixed right-0 top-0 hidden w-[320px] border-l border-border bg-bg min-h-screen lg:block">
        <div className="px-8 py-8">
          {/* Current User */}
          {user && (
            <div className="flex items-center justify-between mb-5">
              <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                <Avatar
                  src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
                  alt={user.username}
                  size="md"
                  fallback={user.username[0]?.toUpperCase()}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text leading-[18px] truncate">
                    {user.username}
                  </p>
                  <p className="text-[11px] text-text-secondary leading-[16px] truncate">
                    {user.displayName || user.email}
                  </p>
                </div>
              </Link>
              <button className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors shrink-0">
                Switch
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestedUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-text-secondary">Suggestions For You</p>
                <button className="text-[11px] font-semibold text-text hover:opacity-60 transition-opacity">
                  See All
                </button>
              </div>
              <div className="space-y-3">
                {suggestedUsers.map((suggested) => {
                  const isFollowing = followingUsers.has(suggested.id);
                  return (
                    <div key={suggested.id} className="flex items-center justify-between">
                      <Link
                        href={`/profile/${suggested.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <Avatar
                          src={
                            suggested.avatarUrl ? `${UPLOADS_URL}${suggested.avatarUrl}` : undefined
                          }
                          alt={suggested.username}
                          size="sm"
                          fallback={suggested.username[0]?.toUpperCase()}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-text leading-[18px] truncate">
                            {suggested.username}
                          </p>
                          <p className="text-[11px] text-text-secondary leading-[16px] truncate">
                            {suggested.displayName || 'Suggested for you'}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => followSuggestion(suggested.id)}
                        disabled={isFollowing}
                        className={`text-[11px] font-semibold shrink-0 transition-colors ${
                          isFollowing
                            ? 'text-text-secondary'
                            : 'text-primary hover:text-primary-dark'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-8">
            <p className="text-[11px] text-text-secondary leading-[16px]">
              About · Help · Press · API · Jobs · Privacy · Terms
            </p>
            <p className="mt-3 text-[11px] text-text-secondary">
              Locations · Language · Blink Verified
            </p>
            <p className="mt-5 text-[11px] text-text-secondary">© 2026 Blink Social</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
