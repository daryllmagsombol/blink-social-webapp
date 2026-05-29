'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; username: string; avatarUrl: string | null };
}

export default function ChatPage() {
  const { userId: otherId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(false);

    Promise.all([
      api.get<{ data: ChatMessage[] }>(`/messages/${otherId}`),
      api.get<{ username: string }>(`/users/${otherId}`).catch(() => ({ username: 'Unknown' })),
    ])
      .then(([msgRes, userRes]) => {
        setMessages(msgRes.data);
        setOtherUser(userRes);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = getSocket(token);

    socket.on('new_message', (msg: ChatMessage) => {
      if (msg.senderId === otherId || msg.senderId === user.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
      disconnectSocket();
    };
  }, [user, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const socket = getSocket(localStorage.getItem('accessToken')!);
    socket.emit('send_message', { receiverId: otherId, content: input });
    setInput('');
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-xl py-8 px-4 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <Skeleton className={`h-10 ${i % 2 === 0 ? 'w-32' : 'w-48'} rounded-xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4">
        <ErrorDisplay message="Could not load conversation" onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col py-8 px-4 pb-20" style={{ height: 'calc(100vh - 5rem)' }}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <Link href="/messages" className="text-sm text-primary">← Back</Link>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
          {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm font-semibold">{otherUser?.username || '...'}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-text-secondary py-8">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                  isMine ? 'bg-primary text-white' : 'bg-bg-secondary text-text'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-full border border-border bg-bg-secondary px-4 py-2 text-sm outline-none focus:border-text-secondary"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
