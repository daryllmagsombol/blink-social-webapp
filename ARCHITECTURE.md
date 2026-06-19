# 🔮 Blink Social — Architecture

## 🛠 Stack

| Layer        | Technology                                           |
| ------------ | ---------------------------------------------------- |
| 📦 Monorepo  | Turborepo + pnpm workspaces                          |
| ⚙️ Backend   | NestJS 11 + TypeScript                               |
| 🎨 Frontend  | Next.js 15 (App Router) + React 19                   |
| 🗄 Database   | PostgreSQL 16 + Prisma ORM                           |
| 🔌 Real-time | **GraphQL Subscriptions** (graphql-ws) + Socket.IO fallback |
| 📊 API Layer | **GraphQL (Apollo Server)** + REST (dual-mode)       |
| 🔐 Auth      | Passport JWT + bcrypt                                |
| 💅 Styling   | Tailwind CSS v4                                      |
| 🗃 State      | Zustand + **Apollo Client InMemoryCache**            |
| 🎯 Icons     | lucide-react                                         |
| 📤 Uploads   | multer (local disk)                                  |

## 📁 Package Structure

```
blink-social-webapp/
├── apps/
│   ├── server/          # NestJS API (port 4000)
│   └── web/             # Next.js frontend (port 3000)
└── packages/
    ├── database/        # Prisma schema + generated client
    └── shared/          # Shared types + constants
```

## ⚙️ Backend Architecture (`apps/server/`)

### 📦 Module Layout

Each feature is a self-contained NestJS module:

| Module          | Responsibility                                                      |
| --------------- | ------------------------------------------------------------------- |
| `auth`          | Register, login, JWT issue/refresh, passport strategy               |
| `users`         | Profile CRUD, avatar                                                |
| `posts`         | Post CRUD, feed, explore, hashtag parsing                           |
| `likes`         | Like/unlike, status check, auto-create notification                 |
| `comments`      | Comment CRUD, auto-create notification                              |
| `follows`       | Follow/unfollow, follower/following lists, auto-create notification |
| `stories`       | Story CRUD, 24h expiry, view tracking                               |
| `messages`      | Send/get messages, conversation list (now uses Conversation model)       |
| `chat`          | Socket.IO gateway for real-time DMs (legacy — being replaced by GraphQL) |
| `graphql`       | Apollo Server setup, Code-First schema, resolvers, subscription PubSub   |
| `notifications` | List, mark read, unread count                                            |
| `uploads`       | Multer image upload (max 10MB)                                           |
| `search`        | Search users/posts, posts by tag, trending tags                          |
| `prisma`        | Global Prisma client provider                                            |

### 📊 GraphQL Architecture (`apps/server/src/graphql/`)

Migrated from Socket.IO real-time chat to **NestJS Code-First GraphQL** with Apollo Server.

```
src/graphql/
├── graphql.module.ts          # Apollo Server + subscriptions setup
├── decorators/
│   └── gql-current-user.decorator.ts  # @GqlCurrentUser() param decorator
├── guards/
│   └── gql-auth.guard.ts      # JWT auth for both HTTP + WS contexts
├── types/                     # Code-First GraphQL object types
│   ├── user.type.ts           # UserType
│   ├── message.type.ts        # MessageEventType, PaginatedMessageType
│   └── conversation.type.ts   # ConversationType
├── resolvers/
│   └── messages.resolver.ts   # Queries, Mutations, Subscriptions for chat
├── providers/
│   ├── pubsub.provider.ts     # Redis or in-memory PubSub factory
│   └── pubsub.module.ts       # Global PubSub module
└── generated/
    └── schema.gql             # Auto-generated schema (gitignored)
```

#### Queries

| Operation | Name | Description |
|-----------|------|-------------|
| Query | `conversations` | List all conversations for current user (with last message, unread count) |
| Query | `conversation(userId, page)` | Paginated messages with a specific user |

#### Mutations

| Operation | Name | Description |
|-----------|------|-------------|
| Mutation | `sendMessage(receiverId, content)` | Send a message (creates conversation if needed) |
| Mutation | `markAsRead(userId)` | Mark all messages from a user as read |

#### Subscriptions

| Operation | Name | Description |
|-----------|------|-------------|
| Subscription | `newMessage` | Real-time message delivery (filtered to sender/receiver) |
| Subscription | `messageRead` | Real-time read receipt notifications |

#### Auth Flow (GraphQL)

```
HTTP Queries/Mutations:
  Client → Authorization: Bearer <JWT> → GqlAuthGuard → @GqlCurrentUser()

WebSocket Subscriptions:
  Client → connectionParams: { token: <JWT> } → graphql-ws onConnect → verify JWT → attach user to context
```

#### PubSub Architecture

```
sendMessage() mutation
  └─ MessagesService.send() → Prisma (persist)
  └─ PubSub.publish('NEW_MESSAGE', { newMessage })
       └─ GraphQL Subscription `newMessage`
            ├─ Filter: (senderId === userId || receiverId === userId)
            └─ Push to all authorized subscribers

Dev: In-memory PubSub (single instance)
Prod: Redis PubSub via REDIS_URL env var (multi-instance scaling)
```

#### Dual-Mode (Transitional)

> Both GraphQL and Socket.IO coexist during migration:
> - `MessagesService` publishes via PubSub (GraphQL) and also via ChatGateway (Socket.IO)
> - REST `/api/messages` endpoints remain fully operational
> - Frontend chat uses GraphQL; Socket.IO kept as fallback
> - Socket.IO cleanup planned after production validation



### 🔐 Auth Flow

1. 📝 Register/login → bcrypt verify → issue **JWT access token** (15m) + **refresh token** (7d)
2. 💾 Client stores both in `localStorage` + `document.cookie` (middleware reads cookie)
3. 🔄 On 401, client auto-refreshes via `/api/auth/refresh` → retries request
4. 🚪 On refresh failure → redirect `/login`

### 🗄 Database Layer

`PrismaService` (extends `PrismaClient`) in `prisma/` module. Global NestJS module. Connection string from `.env` `DATABASE_URL`.

## 🖼 Frontend Architecture (`apps/web/`)

### 📊 Data Flow

```
Page Component
  ├─ REST: useEffect → api.get/post (lib/api.ts) → auto-inject Bearer token → 401 auto-refresh
  └─ GraphQL: Apollo Client
       ├─ useQuery() / useMutation() → HttpLink → POST /api/graphql (Authorization header)
       └─ useSubscription() → GraphQLWsLink → ws://<host>/api/graphql (connectionParams token)
            └─ InMemoryCache → automatic cache updates
```

Apollo Client (`src/lib/apollo-client.ts`) provides a unified data layer via split link (HTTP for queries/mutations, WebSocket for subscriptions). Custom React hooks (`useConversations`, `useConversation`) encapsulate GraphQL operations with optimistic responses and real-time cache updates.

### 🗃 State

- **Auth state**: Zustand store (`stores/auth.ts`) — user object, login/register/logout/fetchMe actions
- **Cache**: Apollo InMemoryCache — normalized GraphQL response cache with type policies
- **Toast**: Zustand store in `components/ui/Toast.tsx` — global `toast()` function

### 🛡 Auth Guard

1. 🛂 `middleware.ts` — **Edge-level**: reads `accessToken` cookie, redirects to `/login` if missing on protected routes
2. 🏗 `layout.tsx` — **Client-level**: `fetchMe()` on mount, redirects if not authenticated

### 🔌 Real-time (Chat)

**Current**: GraphQL subscriptions via `graphql-ws` (WebSocket). JWT token in `connectionParams`. Apollo Client auto-reconnects with exponential backoff (5 retries, max 5s delay).

**Key frontend files:**
- `src/lib/apollo-client.ts` — Apollo Client singleton (HttpLink + GraphQLWsLink split)
- `src/providers/apollo-provider.tsx` — `<ApolloWrapper>` context provider (wraps entire app in root layout)
- `src/graphql/operations.ts` — All GraphQL documents (queries, mutations, subscriptions)
- `src/hooks/use-conversations.ts` — Hook for conversation list
- `src/hooks/use-conversation.ts` — Hook for single conversation with real-time subscription + optimistic send

**Legacy**: Socket.IO client in `lib/socket.ts` (kept for fallback, planned removal). Connects to `/chat` namespace. JWT token in handshake `auth`. Single socket reused across component mounts.

### 🧭 Routing

- `(auth)` route group — login, register pages. No sidebar.
- `(main)` route group — All authenticated pages. Desktop sidebar (fixed, 64px padding offset) + mobile bottom nav (labels under icons).

## 🗄 Database Schema

PostgreSQL with Prisma ORM. **11 models** + **1 enum**:

```
User ──< Post ──< Like
 │ ├──< Comment
 │ ├──>─< Tag (many-to-many via _PostToTag)
 │ └──<! Notification (via "userNotifications" + "actor")
 │
 ├──< Follow (self-referential)
 ├──< Story ──< StoryView
 ├──< Message (sender + receiver) ──< Conversation
 └──< ConversationParticipant (join table)
```

🗑 Cascade deletes on all FKs except `Notification.actorId` (no cascade), `Notification.postId` (SetNull), and `Message.conversationId` (SetNull).

## 💡 Key Design Decisions

- 🔗 **Implicit many-to-many** for Post↔Tag (Prisma auto-creates `_PostToTag` join table)
- 📂 **`process.cwd()` for uploads path** — avoids `__dirname` differences between compiled files in `dist/` vs `dist/subdir/`
- 🖼 **Image URLs stored as relative paths** — frontend prefixes with `http://localhost:4000`
- 🔔 **Notifications auto-created** in service layer (LikesService, CommentsService, FollowsService)
- ⏰ **Story expiry checked server-side** — `expiresAt: { gt: new Date() }` in query, not scheduled cleanup
- 💬 **Conversation model added** — `Conversation` + `ConversationParticipant` replace the old inferred-conversation approach; messages linked via `conversationId`
- 📊 **GraphQL Code-First** — Auto-generated schema from TypeScript decorators; single source of truth with Prisma types
- 🔌 **GraphQL Subscriptions** — Replace Socket.IO for real-time chat; `graphql-ws` protocol with JWT auth in `connectionParams`
- 🗂 **Redis PubSub (prod)** — Multi-instance subscription scaling via `graphql-redis-subscriptions`; in-memory fallback for dev
- 🎯 **Optimistic UI** — Apollo Client optimistic responses on `sendMessage` for instant messaging feel
- 🔄 **Dual-mode transition** — GraphQL + REST + Socket.IO all coexist; phased removal of Socket.IO after production validation

## 🛠 Dev Commands

| Command                            | Action                   |
| ---------------------------------- | ------------------------ |
| `pnpm dev`                         | ▶️ Start both servers   |
| `pnpm --filter @social/server dev` | 🖥 Server only           |
| `pnpm --filter @social/web dev`    | 🌐 Frontend only         |
| `pnpm db:push`                     | 📤 Sync Prisma schema → DB |
| `pnpm db:generate`                 | 🔄 Regenerate Prisma client |
| `pnpm typecheck`                   | ✅ TS check all packages |
