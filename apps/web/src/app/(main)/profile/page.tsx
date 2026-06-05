'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProfileSkeleton, GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';

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
  _count: { likes: number; comments: number };
}

interface Highlight {
  id: string;
  title: string;
  coverUrl: string | null;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, postsCount: 0 });
  const [tab, setTab] = useState<'posts' | 'saved'>('posts');
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [highlights] = useState<Highlight[]>([
    { id: '1', title: 'Portfolio', coverUrl: null },
    { id: '2', title: 'Process', coverUrl: null },
    { id: '3', title: 'Travels', coverUrl: null },
  ]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get<{ data: Post[]; total: number }>(`/users/${user.id}/posts?limit=12`),
      api.get<{ followersCount: number; followingCount: number; postsCount: number }>(`/users/${user.id}`),
    ])
      .then(([postsRes, userRes]) => {
        setPosts(postsRes.data);
        setStats(userRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const loadSaved = async () => {
    setSavedLoading(true);
    try {
      const res = await api.get<{ data: Post[] }>('/bookmarks?limit=12');
      setSavedPosts(res.data);
    } catch {}
    setSavedLoading(false);
  };

  const handleTabChange = (value: 'posts' | 'saved') => {
    setTab(value);
    if (value === 'saved' && savedPosts.length === 0 && !savedLoading) {
      loadSaved();
    }
  };

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  const currentPosts = tab === 'posts' ? posts : savedPosts;
  const currentLoading = tab === 'posts' ? false : savedLoading;
  const emptyIcon = tab === 'posts' ? '📷' : '🔖';
  const emptyTitle = tab === 'posts' ? 'No posts yet' : 'No saved posts';
  const emptyAction = tab === 'posts' ? { label: 'Create your first post', href: '/create' as const } : undefined;

  return (
    <div className="mx-auto max-w-[935px] px-4 py-8 pb-20 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
        {/* Avatar with gradient ring */}
        <div className="flex justify-center md:block">
          <div className="relative mx-auto w-fit">
            <div className="rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] p-[3px]">
              <div className="rounded-full bg-white p-[3px]">
                <Avatar
                  src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
                  alt={user.username}
                  size="xl"
                  className="h-[86px] w-[86px]"
                  fallback={user.username[0]?.toUpperCase()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <h1 className="text-[20px] font-light text-text">{user.username}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Button
                onClick={() => toast('Edit profile coming soon', 'info')}
                variant="secondary"
                size="sm"
                className="text-[13px] font-semibold px-4 py-1.5 rounded-lg border-border"
              >
                Edit profile
              </Button>
              <Button
                onClick={() => toast('View archive coming soon', 'info')}
                variant="secondary"
                size="sm"
                className="text-[13px] font-semibold px-4 py-1.5 rounded-lg border-border"
              >
                View archive
              </Button>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="p-1.5 text-text-secondary hover:text-text transition-colors"
              >
                <MatIcon icon="settings" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center md:justify-start gap-6 md:gap-10 mt-4">
            <span className="text-[14px] text-text">
              <strong className="font-semibold">{stats.postsCount}</strong>{' '}
              <span className="text-text-secondary">posts</span>
            </span>
            <Link href={`/profile/${user.id}/followers`} className="text-[14px] text-text hover:opacity-70">
              <strong className="font-semibold">{stats.followersCount}</strong>{' '}
              <span className="text-text-secondary">followers</span>
            </Link>
            <Link href={`/profile/${user.id}/following`} className="text-[14px] text-text hover:opacity-70">
              <strong className="font-semibold">{stats.followingCount}</strong>{' '}
              <span className="text-text-secondary">following</span>
            </Link>
          </div>

          {/* Bio */}
          {user.displayName && (
            <p className="text-[13px] font-semibold mt-3 text-text">{user.displayName}</p>
          )}
          {user.bio && <p className="text-[13px] mt-0.5 text-text">{user.bio}</p>}
        </div>
      </div>

      {/* Story Highlights */}
      <div className="flex gap-4 md:gap-8 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {highlights.map((hl) => (
          <button
            key={hl.id}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="rounded-full border border-border p-[2px]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-bg-secondary">
                <MatIcon icon="photo_library" className="text-text-secondary text-[24px]" />
              </div>
            </div>
            <span className="text-[11px] text-text font-medium leading-[14px]">
              {hl.title}
            </span>
          </button>
        ))}
        <button className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="rounded-full border border-border p-[2px]">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-bg-secondary">
              <MatIcon icon="add" className="text-text-secondary text-[24px]" />
            </div>
          </div>
          <span className="text-[11px] text-text font-medium leading-[14px]">New</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-t border-border">
        <div className="flex items-center justify-center gap-16">
          <button
            onClick={() => handleTabChange('posts')}
            className={`flex items-center gap-1.5 py-3 text-[12px] font-semibold tracking-[0.05em] uppercase border-t ${
              tab === 'posts'
                ? 'border-text text-text -mt-px'
                : 'border-transparent text-text-secondary hover:text-text'
            } transition-colors`}
          >
            <MatIcon icon="grid_on" filled={tab === 'posts'} className="text-[14px]" />
            POSTS
          </button>
          <button
            onClick={() => handleTabChange('saved')}
            className={`flex items-center gap-1.5 py-3 text-[12px] font-semibold tracking-[0.05em] uppercase border-t ${
              tab === 'saved'
                ? 'border-text text-text -mt-px'
                : 'border-transparent text-text-secondary hover:text-text'
            } transition-colors`}
          >
            <MatIcon icon="bookmark" filled={tab === 'saved'} className="text-[14px]" />
            SAVED
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {currentLoading ? (
        <GridSkeleton />
      ) : currentPosts.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} action={emptyAction} />
      ) : (
        <div className="grid grid-cols-3 gap-[3px] md:gap-1 mt-1">
          {currentPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="group relative aspect-square bg-bg-secondary overflow-hidden"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="flex items-center gap-1.5 text-white text-[14px] font-semibold">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                  >
                    favorite
                  </span>
                  {post._count.likes}
                </span>
                <span className="flex items-center gap-1.5 text-white text-[14px] font-semibold">
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
          ))}
        </div>
      )}
    </div>
  );
}
