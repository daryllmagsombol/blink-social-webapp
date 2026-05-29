'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { MessageCircle, Trash2 } from 'lucide-react';

interface ProfileUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface Post {
  id: string;
  imageUrl: string;
  _count: { likes: number; comments: number };
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = currentUser?.id === id;

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<ProfileUser>(`/users/${id}`),
      api.get<{ data: Post[] }>(`/users/${id}/posts?limit=12`),
      currentUser && !isOwn
        ? api.get<{ following: boolean }>(`/users/${id}/follow/status`)
        : Promise.resolve(null),
    ])
      .then(([profileRes, postsRes, followRes]) => {
        setProfile(profileRes);
        setPosts(postsRes.data);
        if (followRes) setIsFollowing(followRes.following);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, currentUser, isOwn]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${id}/follow`);
        setIsFollowing(true);
        toast('Followed successfully', 'success');
      }
    } catch {
      toast('Failed to update follow', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/me');
      logout();
      toast('Account deleted', 'success');
      router.push('/register');
    } catch {
      toast('Failed to delete account', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading || !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 pb-20">
      <div className="flex items-center gap-6 mb-8">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
          {profile.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{profile.username}</h1>
            {!isOwn && currentUser && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFollow}
                  className={`rounded px-4 py-1 text-xs font-semibold ${
                    isFollowing
                      ? 'border border-border bg-bg'
                      : 'bg-primary text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <Link
                  href={`/messages/${id}`}
                  className="flex items-center gap-1 rounded border border-border px-3 py-1 text-xs font-semibold hover:bg-bg-secondary transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </Link>
              </div>
            )}
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <span><strong>{profile.postsCount}</strong> posts</span>
            <Link href={`/profile/${id}/followers`}><strong>{profile.followersCount}</strong> followers</Link>
            <Link href={`/profile/${id}/following`}><strong>{profile.followingCount}</strong> following</Link>
          </div>
          {profile.displayName && <p className="text-sm font-semibold mt-2">{profile.displayName}</p>}
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
          {isOwn && (
            <div className="mt-4 pt-4 border-t border-border">
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-sm text-danger font-semibold">Delete your account and all data?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="rounded bg-danger px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(false); setDeleting(false); }}
                      disabled={deleting}
                      className="rounded border border-border px-3 py-1 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-danger hover:text-danger/80 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon="📷" title="No posts yet" />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group relative aspect-square bg-bg-secondary overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(http://localhost:4000${post.imageUrl})` }}
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
