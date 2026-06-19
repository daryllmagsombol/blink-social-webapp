'use client';

import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import {
  GET_CONVERSATION,
  SEND_MESSAGE,
  MARK_AS_READ,
  ON_NEW_MESSAGE,
} from '@/graphql/operations';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  read: boolean;
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  receiver: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface PageResult {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function useConversation(otherUserId: string, currentUserId: string) {
  const { data, loading, error, refetch, fetchMore } = useQuery<{
    conversation: PageResult;
  }>(GET_CONVERSATION, {
    variables: { userId: otherUserId, page: 1 },
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to new messages in real-time
  useSubscription(ON_NEW_MESSAGE, {
    onData: ({ client, data: subData }) => {
      if (!subData.data?.newMessage) return;
      const msg = subData.data.newMessage as ChatMessage;

      // Update the conversation cache with the new message
      const cache = client.cache;
      const cached = cache.readQuery<{ conversation: PageResult }>({
        query: GET_CONVERSATION,
        variables: { userId: otherUserId, page: 1 },
      });

      if (cached) {
        // Check if message already exists (dedup)
        const exists = cached.conversation.data.some((m) => m.id === msg.id);
        if (!exists) {
          cache.writeQuery({
            query: GET_CONVERSATION,
            variables: { userId: otherUserId, page: 1 },
            data: {
              conversation: {
                ...cached.conversation,
                data: [...cached.conversation.data, msg],
                total: cached.conversation.total + 1,
              },
            },
          });
        }
      }
    },
  });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_AS_READ);

  const send = useCallback(
    async (receiverId: string, content: string) => {
      return sendMessageMutation({
        variables: { receiverId, content },
        optimisticResponse: {
          __typename: 'Mutation',
          sendMessage: {
            __typename: 'MessageEventType',
            id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            content,
            createdAt: new Date().toISOString(),
            senderId: currentUserId,
            read: false,
            sender: {
              __typename: 'UserType',
              id: currentUserId,
              username: '',
              avatarUrl: null,
            },
            receiver: {
              __typename: 'UserType',
              id: receiverId,
              username: '',
              avatarUrl: null,
            },
          },
        },
      });
    },
    [sendMessageMutation, currentUserId],
  );

  const markAsRead = useCallback(
    (userId: string) => {
      return markAsReadMutation({ variables: { userId } });
    },
    [markAsReadMutation],
  );

  const loadMore = useCallback(() => {
    const current = data?.conversation;
    if (!current || !current.hasMore || loading) return;
    return fetchMore({
      variables: { page: current.page + 1 },
    });
  }, [data, loading, fetchMore]);

  // Reverse messages for display (oldest first)
  const messages = useMemo(() => {
    return data?.conversation?.data ?? [];
  }, [data]);

  return {
    messages,
    total: data?.conversation?.total ?? 0,
    hasMore: data?.conversation?.hasMore ?? false,
    loading,
    error: error?.message || null,
    refetch,
    send,
    markAsRead,
    loadMore,
  };
}
