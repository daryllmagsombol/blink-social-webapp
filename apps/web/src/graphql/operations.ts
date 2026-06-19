import { gql } from '@apollo/client';

// ─── Queries ────────────────────────────────────────────

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    conversations {
      id
      otherUser {
        id
        username
        avatarUrl
      }
      lastMessage {
        id
        content
        createdAt
        senderId
        sender {
          id
        }
      }
      unreadCount
      updatedAt
    }
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($userId: String!, $page: Int) {
    conversation(userId: $userId, page: $page) {
      data {
        id
        content
        createdAt
        senderId
        read
        sender {
          id
          username
          avatarUrl
        }
        receiver {
          id
          username
          avatarUrl
        }
      }
      total
      page
      limit
      hasMore
    }
  }
`;

// ─── Mutations ──────────────────────────────────────────

export const SEND_MESSAGE = gql`
  mutation SendMessage($receiverId: String!, $content: String!) {
    sendMessage(receiverId: $receiverId, content: $content) {
      id
      content
      createdAt
      senderId
      read
      sender {
        id
        username
        avatarUrl
      }
      receiver {
        id
        username
        avatarUrl
      }
    }
  }
`;

export const MARK_AS_READ = gql`
  mutation MarkAsRead($userId: String!) {
    markAsRead(userId: $userId)
  }
`;

// ─── Subscriptions ──────────────────────────────────────

export const ON_NEW_MESSAGE = gql`
  subscription OnNewMessage {
    newMessage {
      id
      content
      createdAt
      senderId
      read
      sender {
        id
        username
        avatarUrl
      }
      receiver {
        id
        username
        avatarUrl
      }
    }
  }
`;

export const ON_MESSAGE_READ = gql`
  subscription OnMessageRead {
    messageRead {
      userId
      readBy
    }
  }
`;
