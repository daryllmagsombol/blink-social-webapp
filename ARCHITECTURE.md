# 🔮 Blink Social — Architecture

## 🛠 Stack

| Layer       | Technology                         |
| ----------- | ---------------------------------- |
| 📦 Monorepo | Turborepo + pnpm workspaces        |
| ⚙️ Backend  | NestJS 11 + TypeScript             |
| 🎨 Frontend | Next.js 15 (App Router) + React 19 |
| 🗄 Database  | PostgreSQL 16 + Prisma ORM         |
| 🔌 Real-time | Socket.IO (WebSocket + polling)   |
| 🔐 Auth      | Passport JWT + bcrypt              |
| 💅 Styling   | Tailwind CSS v4                    |
| 🗃 State     | Zustand                            |
| 🎯 Icons     | lucide-react                       |
| 📤 Uploads   | multer (local disk)                |

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
| `messages`      | Send/get messages, conversation list                                |
| `chat`          | Socket.IO gateway for real-time DMs                                 |
| `notifications` | List, mark read, unread count                                       |
| `uploads`       | Multer image upload (max 10MB)                                      |
| `search`        | Search users/posts, posts by tag, trending tags                     |
| `prisma`        | Global Prisma client provider                                       |

### 🌐 API Pattern

All REST endpoints prefixed with `/api`. Auth protected endpoints use `JwtAuthGuard`. Current user extracted via `@CurrentUser()` decorator.

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
  └─ useEffect → api.get/post (custom fetch wrapper)
       └─ lib/api.ts → auto-inject Bearer token → 401 auto-refresh
            └─ JSON response → setState
```

No React Query/SWR. Raw `fetch` wrapper handles auth, refresh, errors.

### 🗃 State

- **Auth state**: Zustand store (`stores/auth.ts`) — user object, login/register/logout/fetchMe actions
- **Toast**: Zustand store in `components/ui/Toast.tsx` — global `toast()` function

### 🛡 Auth Guard

1. 🛂 `middleware.ts` — **Edge-level**: reads `accessToken` cookie, redirects to `/login` if missing on protected routes
2. 🏗 `layout.tsx` — **Client-level**: `fetchMe()` on mount, redirects if not authenticated

### 🔌 Real-time (Chat)

Socket.IO client in `lib/socket.ts`. Connects to `/chat` namespace. JWT token in handshake `auth`. Single socket reused across component mounts.

### 🧭 Routing

- `(auth)` route group — login, register pages. No sidebar.
- `(main)` route group — All authenticated pages. Desktop sidebar (fixed, 64px padding offset) + mobile bottom nav (labels under icons).

## 🗄 Database Schema

PostgreSQL with Prisma ORM. **9 models** + **1 enum**:

```
User ──< Post ──< Like
 │ ├──< Comment
 │ ├──>─< Tag (many-to-many via _PostToTag)
 │ └──<! Notification (via "userNotifications" + "actor")
 │
 ├──< Follow (self-referential)
 ├──< Story ──< StoryView
 └──< Message (sender + receiver)
```

🗑 Cascade deletes on all FKs except `Notification.actorId` (no cascade) and `Notification.postId` (SetNull).

## 💡 Key Design Decisions

- 🔗 **Implicit many-to-many** for Post↔Tag (Prisma auto-creates `_PostToTag` join table)
- 📂 **`process.cwd()` for uploads path** — avoids `__dirname` differences between compiled files in `dist/` vs `dist/subdir/`
- 🖼 **Image URLs stored as relative paths** — frontend prefixes with `http://localhost:4000`
- 🔔 **Notifications auto-created** in service layer (LikesService, CommentsService, FollowsService)
- ⏰ **Story expiry checked server-side** — `expiresAt: { gt: new Date() }` in query, not scheduled cleanup
- 💬 **Conversation inferred from messages** — no separate Conversation model; computed from Message sender/receiver pairs

## 🛠 Dev Commands

| Command                            | Action                   |
| ---------------------------------- | ------------------------ |
| `pnpm dev`                         | ▶️ Start both servers   |
| `pnpm --filter @social/server dev` | 🖥 Server only           |
| `pnpm --filter @social/web dev`    | 🌐 Frontend only         |
| `pnpm db:push`                     | 📤 Sync Prisma schema → DB |
| `pnpm db:generate`                 | 🔄 Regenerate Prisma client |
| `pnpm typecheck`                   | ✅ TS check all packages |
