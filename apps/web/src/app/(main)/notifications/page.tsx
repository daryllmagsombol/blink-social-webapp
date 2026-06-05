'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { NotificationSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  read: boolean;
  createdAt: string;
  actor: { id: string; username: string; avatarUrl: string | null };
  post: { id: string; imageUrl: string } | null;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get<{ data: Notification[] }>('/notifications')
      .then((res) => setNotifs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-8 px-4 pb-20">
        <div className="mb-6 h-7 w-32 animate-pulse rounded bg-bg-secondary" />
        <NotificationSkeleton />
      </div>
    );
  }

  const typeText = (n: Notification) => {
    switch (n.type) {
      case 'LIKE': return 'liked your post';
      case 'COMMENT': return 'commented on your post';
      case 'FOLLOW': return 'started following you';
    }
  };

  const typeLink = (n: Notification) => {
    if (n.post) return `/posts/${n.post.id}`;
    return `/profile/${n.actor.id}`;
  };

  return (
    <div className="mx-auto max-w-xl py-8 px-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Notifications</h1>
        {notifs.some((n) => !n.read) && (
          <Button onClick={markAllRead} variant="ghost" size="sm" className="text-primary">
            Mark all read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" description="Activity from your posts and follows will appear here." />
      ) : (
        <div className="space-y-1">
          {notifs.map((n, index) => (
            <Link
              key={n.id}
              href={typeLink(n)}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-150 hover:scale-[1.01] hover:bg-bg-secondary animate-fade-in ${n.read ? '' : 'bg-primary/5'}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <Avatar
                src={n.actor.avatarUrl ? `${UPLOADS_URL}${n.actor.avatarUrl}` : undefined}
                alt={n.actor.username}
                size="md"
                fallback={n.actor.username[0]?.toUpperCase()}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{n.actor.username}</span>{' '}
                  {typeText(n)}
                </p>
                <p className="text-xs text-text-secondary">{formatTime(n.createdAt)}</p>
              </div>
              {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(138,43,226,0.5)] shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}
