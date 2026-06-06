'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { UPLOADS_URL } from '@/lib/api';

interface ProfileUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface ProfileHeaderProps {
  user: ProfileUser;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isOwn?: boolean;
  children?: React.ReactNode;
}

export function ProfileHeader({ user, stats, isOwn = false, children }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
      {/* Avatar with gradient ring */}
      <div className="flex justify-center md:block">
        <div className="relative mx-auto w-fit">
          <div className="rounded-full bg-gradient-brand p-[3px]">
            <div className="rounded-full bg-bg p-[3px]">
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
          <h1 className="text-xl font-light text-text">{user.username}</h1>
          {children && (
            <div className="flex items-center justify-center md:justify-start gap-2">
              {children}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center md:justify-start gap-6 md:gap-10 mt-4">
          <span className="text-base text-text">
            <strong className="font-semibold">{stats.postsCount}</strong>{' '}
            <span className="text-text-secondary">posts</span>
          </span>
          <Link href={`/profile/${user.id}/followers`} className="text-base text-text hover:opacity-70">
            <strong className="font-semibold">{stats.followersCount}</strong>{' '}
            <span className="text-text-secondary">followers</span>
          </Link>
          <Link href={`/profile/${user.id}/following`} className="text-base text-text hover:opacity-70">
            <strong className="font-semibold">{stats.followingCount}</strong>{' '}
            <span className="text-text-secondary">following</span>
          </Link>
        </div>

        {/* Bio */}
        {user.displayName && (
          <p className="text-sm font-semibold mt-3 text-text">{user.displayName}</p>
        )}
        {user.bio && <p className="text-sm mt-0.5 text-text">{user.bio}</p>}
      </div>
    </div>
  );
}
