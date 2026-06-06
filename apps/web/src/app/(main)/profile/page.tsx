'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Button } from '@/components/ui/Button';
import { ProfileSkeleton, GridSkeleton } from '@/components/ui/Skeleton';
import { PostGridCard } from '@/components/ui/PostGridCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { MatIcon } from '@/components/ui/Icon';

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
      <ProfileHeader user={user} stats={stats}>
        <Button
          onClick={() => toast('Edit profile coming soon', 'info')}
          variant="secondary"
          size="sm"
          className="text-sm font-semibold px-4 py-1.5 rounded-lg border-border"
        >
          Edit profile
        </Button>
        <Button
          onClick={() => toast('View archive coming soon', 'info')}
          variant="secondary"
          size="sm"
          className="text-sm font-semibold px-4 py-1.5 rounded-lg border-border"
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
      </ProfileHeader>

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
            <span className="text-xs text-text font-medium leading-[14px]">
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
          <span className="text-xs text-text font-medium leading-[14px]">New</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-t border-border">
        <Tabs
          tabs={[
            { label: 'Posts', value: 'posts' },
            { label: 'Saved', value: 'saved' },
          ]}
          value={tab}
          onChange={(v) => handleTabChange(v as 'posts' | 'saved')}
          variant="underline"
        />
      </div>

      {/* Posts Grid */}
      {currentLoading ? (
        <GridSkeleton />
      ) : currentPosts.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} action={emptyAction} />
      ) : (
        <div className="grid grid-cols-3 gap-[3px] md:gap-1 mt-1">
          {currentPosts.map((post, index) => (
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
