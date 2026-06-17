# 🔮 Blink Social

📸 Instagram-like social media platform built with **NestJS**, **Next.js**, **PostgreSQL**, and **Prisma**.

## 🛠 Stack

| Layer       | Tech                                                  |
| ----------- | ----------------------------------------------------- |
| 🎨 Frontend | Next.js 15, React 19, Tailwind CSS v4, Zustand, React Hook Form + Zod |
| ⚙️ Backend  | NestJS 11, Passport JWT, Passport OAuth, Socket.IO    |
| 🗄 Database | PostgreSQL 16, Prisma ORM                             |
| 📦 Monorepo | Turborepo + pnpm                                      |

## 📁 Structure

```
blink-social/
├── apps/
│   ├── server/        # NestJS API (port 4000)
│   └── web/           # Next.js app (port 3000)
├── packages/
│   ├── database/      # Prisma schema + generated client
│   └── shared/        # Shared types & constants
├── uploads/           # Uploaded images (gitignored)
└── docker-compose.yml # PostgreSQL 16
```

## 🚀 Quick start

```bash
# Install
pnpm install

# Start PostgreSQL (if not running locally)
docker compose up -d

# Push schema to DB
pnpm db:push

# Run both apps
pnpm dev
```

🌐 **API** → `http://localhost:4000`
🖥 **Web** → `http://localhost:3000`

## ✨ Features

| Feature                                      | Status  | Phase |
| -------------------------------------------- | ------- | ----- |
| Auth (register, login, JWT refresh)          | ✅ Done | 1     |
| Posts (create, upload, captions, delete)     | ✅ Done | 2     |
| Feed (chronological, followed users)         | ✅ Done | 2     |
| Explore (all posts, discover)                | ✅ Done | 2     |
| Like/unlike posts                            | ✅ Done | 2     |
| Comments on posts                            | ✅ Done | 2     |
| Follow/unfollow users                        | ✅ Done | 2     |
| Stories (24h disappearing)                   | ✅ Done | 3     |
| Direct messages (real-time WebSocket)        | ✅ Done | 3     |
| Notifications (likes, comments, follows)     | ✅ Done | 3     |
| Loading skeletons + error boundaries         | ✅ Done | 4     |
| Infinite scroll                              | ✅ Done | 4     |
| Empty states + toast notifications           | ✅ Done | 4     |
| Responsive sidebar + mobile nav              | ✅ Done | 4     |
| Search users & posts                         | ✅ Done | 5     |
| Hashtags (parsing, clickable, trending)      | ✅ Done | 5     |
| Bookmark / saved posts                       | ✅ Done | 6     |
| Edit posts / comments                        | ✅ Done | 7     |
| Blocking & privacy (private accounts)        | ✅ Done | 8     |
| Report content                               | ✅ Done | 8     |
| Email verification flow                      | ✅ Done | 9     |
| Password reset (forgot + reset)              | ✅ Done | 9     |
| OAuth login (Google & GitHub)                | ✅ Done | 9     |
| Design system (brand tokens, dark mode)      | ✅ Done | 10    |
| Reusable UI components (18 components)       | ✅ Done | 10    |
| Frontend form validation (React Hook Form + Zod) | ✅ Done | 11 |
| Rate limiting / Throttle protection          | ✅ Done | 11    |
| Security hardening (CSP, secure cookies)     | ✅ Done | 11    |
| Suggested users on feed sidebar              | ✅ Done | 11    |
| Message search & conversation search         | ✅ Done | 11    |
| Feed performance optimization                | ✅ Done | 11    |
| Azure VM deployment (Docker + nginx + Cloudflare) | ✅ Done | 12 |

## 🏗 Architecture

⚡ Backend is a **NestJS modular monolith**. Each feature is a self-contained module (auth, users, posts, likes, comments, follows, stories, messages, chat, notifications, uploads, search, blocks, bookmarks, reports, oauth). All REST endpoints prefixed with `/api`. Auth uses JWT access (15m) + refresh (7d) tokens, auto-refreshed on 401.

🖼 Frontend uses **Next.js 15 App Router** with `(auth)` and `(main)` route groups. Data fetched via custom `fetch` wrapper (`lib/api.ts`) with token injection and auto-refresh. Auth state managed with Zustand. Real-time chat via Socket.IO. Form validation handled with **React Hook Form + Zod**.

📖 See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical breakdown.

## 📋 Phase Progress

📊 See [PHASES.md](./PHASES.md) for detailed task tracking across all 12 phases (foundation through deployment).

## 🎨 Design System

🎯 Brand identity: **Purple** (`#8A2EFF`) primary, **Blue** (`#00B7FF`) CTA, **Pink** (`#FF2BA6`) accent — distinct from Instagram, TikTok, and Discord.

- 🌙 Dark mode toggle (persisted to localStorage, respects `prefers-color-scheme`)
- 🧩 18 reusable UI components (Button, Input, Avatar, Modal, Tabs, DropdownMenu, etc.)
- 🎨 Semantic color tokens (light + dark) via CSS variables
- 📐 Typography, spacing, border-radius, and shadow scales

📚 See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for full component API reference.

## ☁️ Deployment

🚀 Deployed to **Azure Linux VM** (`Standard_B2s`) behind **nginx + Cloudflare** (Full/Strict SSL).  
🌐 **Live at** [`https://blink.darjosh.dev`](https://blink.darjosh.dev)  
📦 Docker Compose runs all services — PostgreSQL, backend API, and frontend.  
🔁 CI/CD via GitHub Actions (SSH + `docker compose up -d --build` on push to `main`).

📖 See [Deployment.md](./Deployment.md) for full runbook and troubleshooting.

## 🗄 Prisma shortcuts

```bash
pnpm db:generate   # 🔄 Regenerate Prisma client
pnpm db:push       # 📤 Push schema to DB
pnpm db:migrate    # 🚚 Run migrations
pnpm db:studio     # 🖥 Open Prisma Studio
```

---

**Vibe coded with [OpenCode](https://opencode.ai).**
