'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
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
    <div className="mx-auto max-w-xl py-8 px-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Notifications</h1>
        {notifs.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm text-primary font-semibold">
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" description="Activity from your posts and follows will appear here." />
      ) : (
        <div className="space-y-1">
          {notifs.map((n) => (
            <Link
              key={n.id}
              href={typeLink(n)}
              className={`flex items-center gap-3 rounded p-3 transition-colors ${n.read ? '' : 'bg-primary/5'} hover:bg-bg-secondary`}
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                {n.actor.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{n.actor.username}</span>{' '}
                  {typeText(n)}
                </p>
                <p className="text-xs text-text-secondary">{formatTime(n.createdAt)}</p>
              </div>
              {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
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
