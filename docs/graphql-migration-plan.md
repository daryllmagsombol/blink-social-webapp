# Migration Plan: Socket.IO → NestJS GraphQL + Apollo Client

**Project**: Blink Social Media  
**Date**: June 19, 2026  
**Status**: Not started  
**Total Estimated Effort**: ~11 days

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architectural Decisions](#architectural-decisions)
3. [Phase 0: Pre-Migration Setup](#phase-0-pre-migration-setup)
4. [Phase 1: Backend GraphQL Foundation](#phase-1-backend-graphql-foundation)
5. [Phase 2: Backend Subscriptions](#phase-2-backend-subscriptions)
6. [Phase 3: Frontend Apollo Client](#phase-3-frontend-apollo-client)
7. [Phase 4: Hardening & Production Readiness](#phase-4-hardening--production-readiness)
8. [Phase 5: Decommission Socket.IO](#phase-5-decommission-socketio)
9. [Risk Assessment](#risk-assessment)
10. [End State Architecture](#end-state-architecture)

## Executive Summary

Replace the Socket.IO gateway with NestJS GraphQL (Apollo Server) subscriptions on the backend and Apollo Client on the frontend. This eliminates the in-memory `userSockets` scalability issue, enables a strongly-typed API layer, and opens the door for GraphQL across other modules in the future.

## Architectural Decisions

### Code-First vs Schema-First → **Code-First**

NestJS has first-class Code-First support with `@nestjs/graphql`. TypeScript decorators auto-generate the schema. This keeps one source of truth and aligns with the existing decorator-heavy NestJS patterns.

### Subscription Transport → **graphql-ws (WebSocket)**

Modern standard, supported by Apollo Server 4+ and Apollo Client 3+. Uses WebSocket with auth via `connectionParams`.

### Auth → **JWT via Authorization header + connectionParams.token**

- Queries/Mutations: Bearer token from `Authorization` header
- Subscriptions: Token from `connectionParams.token` in WebSocket handshake
- Unified `GqlAuthGuard` replaces both `JwtAuthGuard` and manual socket auth

### REST Endpoints → **Dual-mode (keep REST, add GraphQL alongside)**

- Phases 1-3: REST endpoints remain fully operational. GraphQL is additive.
- Other modules (auth, posts, etc.) still use REST.

### PubSub → **Redis (`graphql-redis-subscriptions`) with in-memory fallback**

Solves the in-memory `userSockets` Map scalability problem. Falls back to local `PubSub` for dev without Redis.

### Conversation Model → **Add to Prisma**

New `Conversation` + `ConversationParticipant` models replace inefficient GROUP BY derivation.

## Phase 0: Pre-Migration Setup

**Effort**: S (0.5 day)  
**Dependencies**: None

### Tasks

- [x] Install backend packages: `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`, `graphql-ws`, `graphql-redis-subscriptions`, `ioredis`
- [x] Install frontend packages: `@apollo/client`, `graphql`, `graphql-ws`
- [ ] Add `Conversation` + `ConversationParticipant` models to Prisma schema
- [ ] Create Prisma migration
- [ ] Create backfill script for existing messages
- [ ] Add env vars: `REDIS_URL`, `NEXT_PUBLIC_GRAPHQL_URL`

### Rollback

```bash
npx prisma migrate reset
npm uninstall @nestjs/graphql @nestjs/apollo @apollo/server graphql graphql-ws graphql-redis-subscriptions ioredis
```

---

## Phase 1: Backend GraphQL Foundation

**Effort**: M (2 days)  
**Dependencies**: Phase 0

### New Files

| File | Description |
|------|-------------|
| `apps/server/src/graphql/graphql.module.ts` | Apollo Server + GraphQL module setup |
| `apps/server/src/graphql/guards/gql-auth.guard.ts` | JWT auth guard for GraphQL context |
| `apps/server/src/graphql/decorators/gql-current-user.decorator.ts` | `@GqlCurrentUser()` param decorator |
| `apps/server/src/graphql/types/user.type.ts` | `UserType` GraphQL object |
| `apps/server/src/graphql/types/message.type.ts` | `MessageEventType` + `PaginatedMessageType` |
| `apps/server/src/graphql/types/conversation.type.ts` | `ConversationType` |
| `apps/server/src/graphql/types/pagination.type.ts` | Generic paginated response type |
| `apps/server/src/graphql/resolvers/messages.resolver.ts` | Queries & Mutations for messages |

### Files to Modify

| File | Change |
|------|--------|
| `apps/server/src/app.module.ts` | Add `GraphqlModule` import |
| `apps/server/src/messages/messages.service.ts` | Add conversation-aware queries |
| `apps/server/src/messages/messages.module.ts` | Export any new providers |

### GraphQL Operations

```graphql
# Queries
query GetConversations { conversations { id, otherUser { id, username }, lastMessage { content }, unreadCount } }
query GetConversation($userId: String!, $page: Int) { conversation(userId: $userId, page: $page) { data { id, content }, hasMore } }

# Mutations
mutation SendMessage($receiverId: String!, $content: String!) { sendMessage(receiverId: $receiverId, content: $content) { id } }
mutation MarkAsRead($userId: String!) { markAsRead(userId: $userId) }
```

---

## Phase 2: Backend Subscriptions

**Effort**: L (3 days)  
**Dependencies**: Phase 1

### New Files

| File | Description |
|------|-------------|
| `apps/server/src/graphql/providers/pubsub.provider.ts` | Redis/in-memory PubSub factory |
| `apps/server/src/graphql/providers/pubsub.module.ts` | PubSub module |
| `packages/shared/src/graphql-events.ts` | Shared event constants |

### Files to Modify

| File | Change |
|------|--------|
| `apps/server/src/graphql/resolvers/messages.resolver.ts` | Add `@Subscription newMessage` |
| `apps/server/src/messages/messages.service.ts` | Publish to PubSub on send/read |
| `apps/server/src/graphql/graphql.module.ts` | Add `graphql-ws` onConnect auth |
| `packages/shared/src/index.ts` | Export graphql-events |

### Subscription

```graphql
subscription OnNewMessage($conversationId: String) {
  newMessage(conversationId: $conversationId) {
    id, content, createdAt, senderId, read
    sender { id, username, avatarUrl }
    receiver { id, username, avatarUrl }
  }
}
```

### Key Design: Dual-mode

Both Socket.IO gateway and GraphQL subscriptions coexist. `MessagesService` publishes to both PubSub and Socket.IO. Frontend hasn't switched yet.

---

## Phase 3: Frontend Apollo Client

**Effort**: M (2 days)  
**Dependencies**: Phase 2

### New Files

| File | Description |
|------|-------------|
| `apps/web/src/lib/apollo-client.ts` | Apollo Client instance with HttpLink + WebSocketLink |
| `apps/web/src/providers/apollo-provider.tsx` | `<ApolloWrapper>` context provider |
| `apps/web/src/graphql/queries.ts` | `GET_CONVERSATIONS`, `GET_CONVERSATION` |
| `apps/web/src/graphql/mutations.ts` | `SEND_MESSAGE`, `MARK_AS_READ` |
| `apps/web/src/graphql/subscriptions.ts` | `ON_NEW_MESSAGE` |
| `apps/web/src/graphql/index.ts` | Barrel export |
| `apps/web/src/hooks/use-conversations.ts` | React hook for conversation list |
| `apps/web/src/hooks/use-conversation.ts` | React hook for conversation + real-time |

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/app/(main)/messages/page.tsx` | Replace Socket.IO + REST with Apollo hooks |
| `apps/web/src/app/layout.tsx` | Wrap in `<ApolloWrapper>` |

### Migration in ChatPanel

| Before | After |
|--------|-------|
| `socket = getSocket(token)` | `useSubscription(ON_NEW_MESSAGE)` |
| `socket.emit('send_message', ...)` | `useMutation(SEND_MESSAGE)` |
| `api.get('/messages/conversations')` | `useQuery(GET_CONVERSATIONS)` |
| `api.get('/messages/:userId')` | `useQuery(GET_CONVERSATION)` |
| `useState<ChatMessage[]>([])` | Apollo InMemoryCache |
| `socket.on('new_message', ...)` | subscription `onData` callback |

---

## Phase 4: Hardening & Production Readiness

**Effort**: M (2 days)  
**Dependencies**: Phase 3

### Tasks

- [ ] Optimistic responses on `sendMessage` mutation
- [ ] Infinite scroll pagination via `fetchMore`
- [ ] Read receipts via `MESSAGE_READ` subscription
- [ ] Apollo `onError` link for 401 token refresh
- [ ] ThrottlerGuard on GraphQL resolvers
- [ ] Query depth limiting (max 5)
- [ ] Query complexity analysis
- [ ] WebSocket keep-alive pings (30s)
- [ ] Subscription reconnection with fresh token
- [ ] Conversation filter on subscriptions

---

## Phase 5: Decommission Socket.IO

**Effort**: S (0.5 day)  
**Dependencies**: Phase 4 validated in production ≥1 week

### Files to Delete

| File |
|------|
| `apps/server/src/chat/chat.gateway.ts` |
| `apps/server/src/chat/chat.module.ts` |
| `apps/web/src/lib/socket.ts` |

### Files to Modify

| File | Change |
|------|--------|
| `apps/server/src/app.module.ts` | Remove `ChatModule` import |
| `apps/server/package.json` | Remove socket.io deps |
| `apps/web/package.json` | Remove socket.io-client dep |

### Dependencies to Remove

```bash
# Backend
npm uninstall @nestjs/platform-socket.io @nestjs/websockets socket.io

# Frontend
npm uninstall socket.io-client
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebSocket auth incompatibility | Medium | High | Careful `onConnect` handler; test both HTTP and WS auth flows |
| Apollo cache normalization issues | Medium | Medium | Define `typePolicies` with proper `keyFields` |
| Redis unavailable in production | Low | High | In-memory PubSub fallback; add health check |
| Subscription memory leak | Medium | High | `maxSubscriptions` limit; cleanup on disconnect |
| Prisma migration (Conversation backfill) | Medium | High | Nullable `conversationId`; test backfill on staging |
| Token refresh during active subscription | Medium | Medium | Reconnect-with-new-token in Apollo Client |
| Dual transport confusion (Phase 2-3) | Medium | Low | `MessagesService` publishes to both; clear comments |

---

## End State Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│     Frontend (Next.js 15)   │     │      Backend (NestJS 11)     │
│                             │     │                              │
│  Apollo Client              │     │  GraphQL Endpoint            │
│  ├─ HttpLink (queries/mut)  │────▶│  ├─ Queries                   │
│  ├─ WebSocketLink (subs)    │────▶│  ├─ Mutations                │
│  └─ InMemoryCache            │     │  └─ Subscriptions             │
│                             │     │     │                        │
│  Zustand (auth only)        │     │  PubSub (Redis or in-mem)   │
│                             │     │     │                        │
│  ❌ socket.io-client        │     │  Prisma ORM                  │
│  ❌ socket.ts               │     │  ├─ Conversation (NEW)       │
│                             │     │  ├─ ConversationParticipant  │
│                             │     │  ├─ Message                  │
│                             │     │  └─ User                     │
└─────────────────────────────┘     └──────────────────────────────┘
```

### Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Real-time transport | Socket.IO (proprietary) | graphql-ws (standard) |
| Scalability | In-memory `userSockets` Map | Redis PubSub (multi-instance) |
| Type safety | None (any-typed WS events) | Code-First GraphQL types |
| API surface | REST + WS (two patterns) | GraphQL (unified pattern) |
| Data fetching | Multiple REST calls | Single GraphQL query |
| Cache | React state only | Apollo InMemoryCache |
| Conversation model | Derived at query time | First-class DB entity |
| Auth | Separate REST guard + WS handshake | Unified GraphQL context guard |
