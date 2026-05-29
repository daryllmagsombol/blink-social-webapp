'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function FollowingPage() {
  const { id } = useParams<{ id: string }>();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: FollowUser[] }>(`/users/${id}/following`)
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-xl py-8 px-4 pb-20">
      <h1 className="mb-6 text-xl font-bold">Following</h1>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-text-secondary">Not following anyone yet.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 rounded border border-border bg-bg p-3 hover:bg-bg-secondary">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                {u.username[0].toUpperCase()}
              </div>
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
