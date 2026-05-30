'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ProfileSkeleton, GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Post {
  id: string;
  imageUrl: string;
  _count: { likes: number; comments: number };
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, postsCount: 0 });
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);

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

  const handleTabChange = (value: string) => {
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
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <div className="flex items-center gap-6 mb-8">
        <Avatar
            src={user.avatarUrl ? `${UPLOADS_URL}${user.avatarUrl}` : undefined}
            alt={user.username}
            size="xl"
            fallback={user.username[0]?.toUpperCase()}
          />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <Button
              onClick={() => { logout(); window.location.href = '/login'; }}
              variant="secondary"
              size="sm"
            >
              Log out
            </Button>
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <span><strong>{stats.postsCount}</strong> posts</span>
            <Link href={`/profile/${user.id}/followers`}><strong>{stats.followersCount}</strong> followers</Link>
            <Link href={`/profile/${user.id}/following`}><strong>{stats.followingCount}</strong> following</Link>
          </div>
          {user.displayName && <p className="text-sm font-semibold mt-2">{user.displayName}</p>}
          {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
        </div>
      </div>

      <div className="mb-6">
        <Tabs
          tabs={[
            { label: `Posts (${stats.postsCount})`, value: 'posts' },
            { label: `Saved (${savedPosts.length})`, value: 'saved' },
          ]}
          value={tab}
          onChange={handleTabChange}
          variant="underline"
        />
      </div>

      {currentLoading ? (
        <GridSkeleton />
      ) : currentPosts.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} action={emptyAction} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {currentPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group relative aspect-square bg-bg-secondary overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm">♥ {post._count.likes}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
