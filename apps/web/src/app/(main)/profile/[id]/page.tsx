'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
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
        <Avatar
            src={profile.avatarUrl ? `${UPLOADS_URL}${profile.avatarUrl}` : undefined}
            alt={profile.username}
            size="xl"
            fallback={profile.username[0]?.toUpperCase()}
          />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{profile.username}</h1>
            {profile.isPrivate && (
              <Lock className="h-4 w-4 text-text-secondary shrink-0" />
            )}
            {!isOwn && currentUser && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleFollow}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button
                  onClick={() => router.push(`/messages/${id}`)}
                  variant="secondary"
                  size="sm"
                  icon={<MessageCircle className="h-3.5 w-3.5" />}
                >
                  Message
                </Button>
                <Button
                  onClick={toggleBlock}
                  variant={blocked ? 'danger' : 'secondary'}
                  size="sm"
                  icon={blocked ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                >
                  {blocked ? 'Blocked' : 'Block'}
                </Button>
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
              <Button
                onClick={togglePrivacy}
                disabled={togglingPrivacy}
                variant="ghost"
                size="sm"
                icon={isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                className="text-text-secondary"
              >
                {togglingPrivacy ? 'Updating...' : isPrivate ? 'Private account (switch to public)' : 'Public account (switch to private)'}
              </Button>
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-sm text-danger font-semibold">Delete your account and all data?</p>
                  <div className="flex gap-2">
<Button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      variant="danger"
                      size="sm"
                      loading={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </Button>
                    <Button
                      onClick={() => { setConfirmDelete(false); setDeleting(false); }}
                      disabled={deleting}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmDelete(true)}
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-danger hover:text-danger/80"
                >
                  Delete account
                </Button>
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
