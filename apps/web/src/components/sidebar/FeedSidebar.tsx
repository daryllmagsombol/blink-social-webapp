'use client';

import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';

export interface SuggestedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  _count?: { followers: number };
}

interface FeedSidebarProps {
  suggestedUsers: SuggestedUser[];
  followingUsers: Set<string>;
  onFollow: (userId: string) => void;
}

export function FeedSidebar({ suggestedUsers, followingUsers, onFollow }: FeedSidebarProps) {
  const { user } = useAuth();

  return (
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
                <p className="text-sm font-semibold text-text leading-[18px] truncate">
                  {user.username}
                </p>
                <p className="text-xs text-text-secondary leading-[16px] truncate">
                  {user.displayName || user.email}
                </p>
              </div>
            </Link>
            <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors shrink-0">
              Switch
            </button>
          </div>
        )}

        {/* Suggestions */}
        {suggestedUsers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-text-secondary">Suggestions For You</p>
              <button className="text-xs font-semibold text-text hover:opacity-60 transition-opacity">
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
                          suggested.avatarUrl
                            ? `${UPLOADS_URL}${suggested.avatarUrl}`
                            : undefined
                        }
                        alt={suggested.username}
                        size="sm"
                        fallback={suggested.username[0]?.toUpperCase()}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text leading-[18px] truncate">
                          {suggested.username}
                        </p>
                        <p className="text-xs text-text-secondary leading-[16px] truncate">
                          {suggested.displayName || 'Suggested for you'}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => onFollow(suggested.id)}
                      disabled={isFollowing}
                      className={`text-xs font-semibold shrink-0 transition-colors ${
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
          <p className="text-xs text-text-secondary leading-[16px]">
            About · Help · Press · API · Jobs · Privacy · Terms
          </p>
          <p className="mt-3 text-xs text-text-secondary">
            Locations · Language · Blink Verified
          </p>
          <p className="mt-5 text-xs text-text-secondary">© 2026 Blink Social</p>
        </div>
      </div>
    </aside>
  );
}
