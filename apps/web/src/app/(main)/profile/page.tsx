'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { api, UPLOADS_URL } from '@/lib/api';
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
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, postsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <div className="flex items-center gap-6 mb-8">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
          {user.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="rounded border border-border px-3 py-1 text-xs font-semibold"
            >
              Log out
            </button>
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

      {posts.length === 0 ? (
        <EmptyState icon="📷" title="No posts yet" action={{ label: 'Create your first post', href: '/create' }} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
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
