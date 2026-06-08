'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { MessageCircle, Shield, ShieldOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { MatIcon } from '@/components/ui/Icon';

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
  const [tab, setTab] = useState<'posts' | 'tagged'>('posts');

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
    <div className="mx-auto max-w-[935px] px-4 py-8 animate-fade-in">
      <ProfileHeader user={profile} stats={{ postsCount: profile.postsCount, followersCount: profile.followersCount, followingCount: profile.followingCount }}>
        {profile.isPrivate && !isOwn && (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        )}
        {!isOwn && currentUser && (
          <>
            <Button
              onClick={toggleFollow}
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              className={`text-sm font-semibold px-5 py-1.5 rounded-lg ${
                isFollowing ? 'border-border' : 'bg-primary text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button
              onClick={() => router.push(`/messages/${id}`)}
              variant="secondary"
              size="sm"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg border-border"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            <button
              onClick={toggleBlock}
              className="p-1.5 text-text-secondary hover:text-text transition-colors"
            >
              <MatIcon icon="more_horiz" />
            </button>
          </>
        )}
        {isOwn && (
          <>
            <Button
              onClick={() => toast('Edit profile coming soon', 'info')}
              variant="secondary"
              size="sm"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg border-border"
            >
              Edit profile
            </Button>
            <button className="p-1.5 text-text-secondary hover:text-text transition-colors">
              <MatIcon icon="settings" />
            </button>
          </>
        )}
      </ProfileHeader>

      {/* Owner Settings */}
          {isOwn && (
            <div className="mt-5 pt-4 border-t border-border space-y-3">
              <Toggle
                checked={!isPrivate}
                onChange={togglePrivacy}
                disabled={togglingPrivacy}
                label={isPrivate ? 'Private account' : 'Public account'}
              />
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

      {/* Tabs */}
      <div className="border-t border-border">
        <Tabs
          tabs={[
            { label: 'Posts', value: 'posts' },
            { label: 'Tagged', value: 'tagged' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as 'posts' | 'tagged')}
          variant="underline"
        />
      </div>

      {/* Posts Grid or Private Account */}
      {tab === 'posts' ? (
        posts.length === 0 ? (
          !isOwn && profile.isPrivate && !isFollowing ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg p-16 text-center mt-6">
              <Lock className="h-10 w-10 text-text-secondary mb-3" />
              <p className="text-text-secondary font-medium">This account is private</p>
              <p className="mt-1 text-sm text-text-secondary">
                Follow this account to see their photos and videos.
              </p>
            </div>
          ) : (
            <EmptyState icon="📷" title="No posts yet" />
          )
        ) : (
          <div className="grid grid-cols-3 gap-[3px] md:gap-1 mt-1">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group relative aspect-square bg-bg-secondary overflow-hidden"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <img
                  src={`${UPLOADS_URL}${post.imageUrl}`}
                  alt="Post"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="flex items-center gap-1.5 text-white text-base font-semibold">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                    >
                      favorite
                    </span>
                    {post._count.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-white text-base font-semibold">
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
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg p-16 text-center mt-6">
          <MatIcon icon="bookmark" className="text-text-secondary text-[32px] mb-3" />
          <p className="text-text-secondary font-medium">No tagged posts</p>
        </div>
      )}
    </div>
  );
}
