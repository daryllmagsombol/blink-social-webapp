'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { MessageCircle, Trash2, Shield, ShieldOff, Lock, Unlock } from 'lucide-react';

interface ProfileUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
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
  const [blocked, setBlocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);

  const isOwn = currentUser?.id === id;

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<ProfileUser>(`/users/${id}`),
      api.get<{ data: Post[] }>(`/users/${id}/posts?limit=12`),
      currentUser && !isOwn
        ? api.get<{ following: boolean }>(`/users/${id}/follow/status`)
        : Promise.resolve(null),
      currentUser && !isOwn
        ? api.get<{ blocked: boolean }>(`/users/${id}/block/status`)
        : Promise.resolve(null),
    ])
      .then(([profileRes, postsRes, followRes, blockRes]) => {
        setProfile(profileRes);
        setIsPrivate(profileRes.isPrivate);
        setPosts(postsRes.data);
        if (followRes) setIsFollowing(followRes.following);
        if (blockRes) setBlocked(blockRes.blocked);
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

  const toggleBlock = async () => {
    try {
      if (blocked) {
        await api.delete(`/users/${id}/block`);
        setBlocked(false);
        toast('Unblocked', 'success');
      } else {
        await api.post(`/users/${id}/block`);
        setBlocked(true);
        setPosts([]);
        toast('Blocked', 'success');
      }
    } catch {
      toast('Failed to update block', 'error');
    }
  };

  const togglePrivacy = async () => {
    setTogglingPrivacy(true);
    try {
      const res = await api.patch<{ isPrivate: boolean }>('/users/me/privacy');
      setIsPrivate(res.isPrivate);
      toast(res.isPrivate ? 'Account set to private' : 'Account set to public', 'success');
    } catch {
      toast('Failed to update privacy', 'error');
    } finally {
      setTogglingPrivacy(false);
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
            {profile.isPrivate && (
              <Lock className="h-4 w-4 text-text-secondary shrink-0" />
            )}
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
                <button
                  onClick={toggleBlock}
                  className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold border ${
                    blocked ? 'border-danger text-danger' : 'border-border'
                  }`}
                >
                  {blocked ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  {blocked ? 'Blocked' : 'Block'}
                </button>
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
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <button
                onClick={togglePrivacy}
                disabled={togglingPrivacy}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
              >
                {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {togglingPrivacy ? 'Updating...' : isPrivate ? 'Private account (switch to public)' : 'Public account (switch to private)'}
              </button>
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
        !isOwn && profile.isPrivate && !isFollowing ? (
          <div className="flex flex-col items-center justify-center rounded border border-border bg-bg p-12 text-center">
            <Lock className="h-10 w-10 text-text-secondary mb-3" />
            <p className="text-text-secondary font-medium">Private account</p>
            <p className="mt-1 text-sm text-text-secondary">Follow this user to see their posts.</p>
          </div>
        ) : (
          <EmptyState icon="📷" title="No posts yet" />
        )
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
