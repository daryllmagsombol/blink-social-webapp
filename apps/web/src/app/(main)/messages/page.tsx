'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth';

interface Convo {
  user: { id: string; username: string; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Convo[]>('/messages/conversations')
      .then(setConvos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4 pb-20">
      <h1 className="mb-6 text-xl font-bold">Messages</h1>

      {convos.length === 0 ? (
        <div className="rounded border border-border bg-bg p-8 text-center">
          <p className="text-text-secondary">No messages yet.</p>
          <p className="text-sm text-text-secondary mt-1">Go to someones profile and send a message.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {convos.map((c) => (
            <Link
              key={c.user.id}
              href={`/messages/${c.user.id}`}
              className="flex items-center gap-3 rounded p-3 hover:bg-bg-secondary transition-colors"
            >
              <div className="h-12 w-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                {c.user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{c.user.username}</p>
                <p className="text-xs text-text-secondary truncate">{c.lastMessage.content}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
