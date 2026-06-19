'use client';

import { useQuery } from '@apollo/client';
import { GET_CONVERSATIONS } from '@/graphql/operations';
import { useMemo } from 'react';

interface OtherUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string };
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export function useConversations() {
  const { data, loading, error, refetch } = useQuery<{
    conversations: Conversation[];
  }>(GET_CONVERSATIONS);

  const conversations = useMemo(() => {
    const list = data?.conversations ?? [];
    // Safety-net dedup by otherUser.id — server already dedups but this guards
    // against any edge cases in Apollo cache or subscription interactions
    const seen = new Set<string>();
    return list.filter((c) => {
      const otherId = c.otherUser?.id;
      if (!otherId || seen.has(otherId)) return false;
      seen.add(otherId);
      return true;
    });
  }, [data]);

  return {
    conversations,
    loading,
    error: error?.message || null,
    refetch,
  };
}
