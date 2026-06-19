'use client';

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton, MessageSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { MatIcon } from '@/components/ui/Icon';
import { NewUserSearch } from '@/components/chat/NewUserSearch';
import { timeAgo } from '@/lib/utils';
import { useConversations } from '@/hooks/use-conversations';
import { useConversation } from '@/hooks/use-conversation';

// ─── Types ───────────────────────────────────────────────

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; username: string; avatarUrl: string | null };
  receiver?: { id: string; username: string; avatarUrl: string | null };
  read?: boolean;
  __typename?: string;
}

interface OtherUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })} ${time}`;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function shouldShowDateDivider(
  messages: ChatMessage[],
  index: number,
): boolean {
  if (index === 0) return true;
  const current = new Date(messages[index].createdAt);
  const previous = new Date(messages[index - 1].createdAt);
  return (
    current.getDate() !== previous.getDate() ||
    current.getMonth() !== previous.getMonth() ||
    current.getFullYear() !== previous.getFullYear()
  );
}

function shouldShowAvatar(
  messages: ChatMessage[],
  index: number,
  userId: string,
): boolean {
  const msg = messages[index];
  if (msg.senderId === userId) return false;
  if (index === messages.length - 1) return true;
  const next = messages[index + 1];
  return next.senderId !== msg.senderId;
}

// ─── Placeholder (right panel when no conversation selected) ───

function Placeholder() {
  return (
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-bg text-center p-8 min-h-0 overflow-hidden">
      <div className="max-w-xs space-y-4">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-bg-secondary">
          <MatIcon icon="chat_bubble" className="text-4xl text-text-secondary" />
        </div>
        <h3 className="text-lg font-bold text-text">Your Messages</h3>
        <p className="text-sm text-text-secondary">
          Select a conversation from the list to start messaging your friends or
          collaborators.
        </p>
      </div>
    </div>
  );
}

// ─── Chat Panel ──────────────────────────────────────────

function ChatPanel({
  userId,
  currentUserId,
  onBack,
}: {
  userId: string;
  currentUserId: string;
  onBack: () => void;
}) {
  const {
    messages,
    loading,
    error: gqlError,
    send: sendGql,
    markAsRead,
  } = useConversation(userId, currentUserId);

  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSearchInputRef = useRef<HTMLInputElement>(null);

  // Load other user info via REST (still using api for non-message user data)
  useEffect(() => {
    setUserLoading(true);
    api
      .get<OtherUser>(`/users/${userId}`)
      .then(setOtherUser)
      .catch(() =>
        setOtherUser({ id: userId, username: 'Unknown', avatarUrl: null }),
      )
      .finally(() => setUserLoading(false));
  }, [userId]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    markAsRead(userId);
  }, [userId, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await sendGql(userId, input);
      setInput('');
    } catch {
      // Error handled by Apollo error link
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const avatarSrc = otherUser?.avatarUrl
    ? `${UPLOADS_URL}${otherUser.avatarUrl}`
    : undefined;

  // Filter out optimistic temp messages from display (kept until server responds)
  const realMessages = useMemo(
    () => messages.filter((m) => !m.id.startsWith('temp-')),
    [messages],
  );

  const filteredMessages = chatSearchQuery.trim()
    ? realMessages.filter((msg) =>
        msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase()),
      )
    : realMessages;

  const groupedMessages = filteredMessages.map((msg, index) => ({
    message: msg,
    isMine: msg.senderId === currentUserId,
    showDateDivider: shouldShowDateDivider(filteredMessages, index),
    showAvatar: shouldShowAvatar(filteredMessages, index, currentUserId),
  }));

  // --- Loading ---
  if (loading || userLoading) {
    return (
      <div className="flex flex-1 flex-col bg-bg min-h-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
          <Skeleton className="h-8 w-8 rounded-full md:hidden" />
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {i % 2 !== 0 && (
                <Skeleton variant="circular" className="h-8 w-8 shrink-0 self-end" />
              )}
              <Skeleton
                className={`h-10 ${
                  i % 2 === 0 ? 'w-32' : 'w-48'
                } rounded-2xl ${
                  i % 2 === 0 ? 'rounded-br-none' : 'rounded-bl-none'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="shrink-0 border-t border-border px-4 py-3">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  // --- Error ---
  if (gqlError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg p-4 min-h-0">
        <ErrorDisplay
          message="Could not load conversation"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-bg min-h-0">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-3 shrink-0">
        {/* Back — mobile only */}
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors lg:hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Back to conversations"
        >
          <MatIcon icon="arrow_back" />
        </button>

        <Avatar
          src={avatarSrc}
          alt={otherUser?.username || '?'}
          size="md"
          fallback={otherUser?.username?.[0]?.toUpperCase() || '?'}
          online={otherUser?.isOnline}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {otherUser?.username || '...'}
          </p>
          <p className="text-xs text-text-secondary">
            {otherUser?.isOnline ? 'Active now' : 'Offline'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Voice call"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="call" />
          </button>
          <button
            type="button"
            aria-label="Video call"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="videocam" />
          </button>
          <button
            type="button"
            aria-label="Info"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="info" />
          </button>
          <button
            type="button"
            onClick={() => {
              setChatSearchOpen((v) => !v);
              if (!chatSearchOpen) {
                setTimeout(() => chatSearchInputRef.current?.focus(), 100);
              } else {
                setChatSearchQuery('');
              }
            }}
            aria-label="Search conversation"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              chatSearchOpen
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <MatIcon icon="search" />
          </button>
        </div>
      </div>

      {/* ─── Chat Search Bar ─── */}
      {chatSearchOpen && (
        <div className="shrink-0 border-b border-border bg-bg px-3 py-2">
          <div className="relative">
            <MatIcon
              icon="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              ref={chatSearchInputRef}
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="w-full rounded-lg border border-border bg-bg-secondary py-1.5 pl-9 pr-8 text-sm text-text outline-none placeholder:text-text-secondary transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {chatSearchQuery && (
              <button
                type="button"
                onClick={() => setChatSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              >
                <MatIcon icon="close" className="text-[16px]" />
              </button>
            )}
          </div>
          {chatSearchQuery.trim() && (
            <p className="mt-1 text-xs text-text-secondary">
              {filteredMessages.length === 0
                ? 'No matches found.'
                : `${filteredMessages.length} match${filteredMessages.length === 1 ? '' : 'es'} found.`}
            </p>
          )}
        </div>
      )}

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth">
        {realMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-bg-secondary">
              <MatIcon icon="chat" className="text-2xl text-text-secondary" />
            </div>
            <p className="font-medium text-text">No messages yet</p>
            <p className="mt-1 text-sm text-text-secondary">Say hi! &#x1F44B;</p>
            <p className="mt-1 text-xs text-text-secondary">
              Your conversation will appear here.
            </p>
          </div>
        ) : chatSearchOpen && chatSearchQuery.trim() && filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
              <MatIcon icon="search_off" className="text-xl text-text-secondary" />
            </div>
            <p className="font-medium text-text">No matches</p>
            <p className="mt-1 text-sm text-text-secondary">
              Try a different search term.
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map(({ message: msg, isMine, showDateDivider, showAvatar }) => (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center py-4">
                    <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary">
                      {getDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-2 mb-1 ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isMine && (
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <Avatar
                          src={avatarSrc}
                          alt={otherUser?.username || '?'}
                          size="xs"
                          fallback={otherUser?.username?.[0]?.toUpperCase() || '?'}
                        />
                      )}
                    </div>
                  )}

                  <div
                    className={`flex flex-col max-w-[75%] ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.content && (
                      <div
                        className={`relative px-3.5 py-2 text-sm leading-relaxed break-words ${
                          isMine
                            ? 'bg-primary text-white rounded-2xl rounded-br-none'
                            : 'bg-bg-secondary text-text rounded-2xl rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-0.5 px-1">
                      <span className="text-[10px] text-text-secondary leading-none">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {isMine && (
                        <MatIcon
                          icon="done_all"
                          className="text-[12px] text-primary leading-none"
                        />
                      )}
                    </div>
                  </div>

                  {isMine && <div className="w-8 shrink-0" />}
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input ─── */}
      <div className="shrink-0 border-t border-border bg-bg px-3 py-3 pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Add emoji"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="emoji_emotions" />
          </button>
          <button
            type="button"
            aria-label="Attach image"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="image" />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className="w-full rounded-full border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="send" filled />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('user');
  const {
    conversations: convos,
    loading,
    error,
    refetch: refetchConvos,
  } = useConversations();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  // Clean up the ?user= query param from the URL after reading it once
  const hasInitialParam = useRef(!!initialUserId);
  useEffect(() => {
    if (hasInitialParam.current) {
      router.replace('/messages', { scroll: false });
    }
  }, [router]);

  const filteredConvos = useMemo(
    () =>
      convos.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const name = c.otherUser?.username?.toLowerCase() || '';
        const lastMsg = c.lastMessage?.content?.toLowerCase() || '';
        return name.includes(q) || lastMsg.includes(q);
      }),
    [convos, search],
  );

  const handleSelect = (id: string) => {
    setSelectedUserId(id);
  };

  const handleBack = () => {
    setSelectedUserId(null);
  };

  const handleNewConversation = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="flex bg-bg border-r border-border h-[calc(100dvh-60px)] lg:h-[100dvh] overflow-hidden">
      {/* ─── Left Panel: Conversation List ─── */}
      <div
        className={`flex flex-col w-full lg:w-96 lg:border-r border-border shrink-0 bg-bg min-h-0 overflow-hidden ${
          selectedUserId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <h1 className="text-xl font-bold text-text">Messages</h1>
          <button
            type="button"
            onClick={() => setNewMessageOpen(true)}
            aria-label="New message"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MatIcon icon="edit" />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-4 py-3 shrink-0">
          <MatIcon
            icon="search"
            className="absolute left-7 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-10 pr-4 text-sm text-text outline-none placeholder:text-text-secondary transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <MessageSkeleton />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorDisplay
                message={error}
                onRetry={refetchConvos}
              />
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="p-4">
              {search ? (
                <EmptyState
                  icon={<MatIcon icon="search_off" className="text-4xl text-text-secondary" />}
                  title="No conversations found"
                  description="Try a different search."
                />
              ) : (
                <EmptyState
                  icon={<MatIcon icon="chat" className="text-4xl text-text-secondary" />}
                  title="No messages yet"
                  description="Go to someone&apos;s profile and send a message."
                />
              )}
            </div>
          ) : (
            <>
              {filteredConvos.map((c, index) => {
                const isActive = selectedUserId === c.otherUser?.id;
                const hasUnread = (c.unreadCount ?? 0) > 0;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.otherUser?.id)}
                    className={`relative flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 animate-fade-in hover:bg-bg-secondary ${
                      isActive ? 'bg-bg-secondary' : ''
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                    )}

                    <div className="relative shrink-0">
                      <Avatar
                        src={
                          c.otherUser?.avatarUrl
                            ? `${UPLOADS_URL}${c.otherUser.avatarUrl}`
                            : undefined
                        }
                        alt={c.otherUser?.username || '?'}
                        size="md"
                        fallback={c.otherUser?.username?.[0]?.toUpperCase()}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm truncate ${
                            hasUnread
                              ? 'font-bold text-text'
                              : 'font-semibold text-text'
                          }`}
                        >
                          {c.otherUser?.username || 'Unknown'}
                        </span>
                        <span className="shrink-0 text-xs text-text-secondary">
                          {c.updatedAt ? timeAgo(c.updatedAt) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span
                          className={`text-sm truncate ${
                            hasUnread
                              ? 'font-medium text-text'
                              : 'text-text-secondary'
                          }`}
                        >
                          {c.lastMessage?.content || 'Start a conversation'}
                        </span>
                        {hasUnread && (
                          <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ─── Right Panel: Chat or Placeholder ─── */}
      {selectedUserId && user ? (
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${!selectedUserId ? 'hidden lg:flex' : 'flex'}`}>
          <ChatPanel
            userId={selectedUserId}
            currentUserId={user.id}
            onBack={handleBack}
          />
        </div>
      ) : (
        <Placeholder />
      )}

      {/* New message modal */}
      <NewUserSearch
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onSelectUser={handleNewConversation}
      />
    </div>
  );
}
