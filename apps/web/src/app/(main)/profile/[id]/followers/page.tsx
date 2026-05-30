'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function FollowersPage() {
  const { id } = useParams<{ id: string }>();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: FollowUser[] }>(`/users/${id}/followers`)
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-xl py-8 px-4 pb-20">
      <h1 className="mb-6 text-xl font-bold">Followers</h1>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded border border-border bg-bg p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No followers yet" />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 rounded border border-border bg-bg p-3 hover:bg-bg-secondary">
              <Avatar
                src={u.avatarUrl ? `${UPLOADS_URL}${u.avatarUrl}` : undefined}
                alt={u.username}
                size="md"
                fallback={u.username[0]?.toUpperCase()}
              />
              <div>
                <p className="text-sm font-semibold">{u.username}</p>
                {u.displayName && <p className="text-xs text-text-secondary">{u.displayName}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
