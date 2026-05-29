# Blink Social

Instagram-like social media platform built with NestJS, Next.js, PostgreSQL, and Prisma.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, Zustand |
| Backend | NestJS 11, Passport JWT, Socket.IO |
| Database | PostgreSQL 16, Prisma ORM |
| Monorepo | Turborepo + pnpm |

## Features

- User auth — register, login, JWT refresh
- Posts — create with image upload, caption, delete
- Feed — chronological posts from followed users
- Explore — discover all posts
- Like/unlike posts
- Comments on posts
- Follow/unfollow users
- Followers/following lists
- Stories (24h disappearing)
- Direct messages (real-time WebSocket)
- Notifications (likes, comments, follows)

## Structure

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

## Quick start

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

- API: `http://localhost:4000`
- Web: `http://localhost:3000`

## Prisma shortcuts

```bash
pnpm db:generate   # Regenerate Prisma client
pnpm db:push       # Push schema to DB
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Prisma Studio
```

---

**Vibe coded with [OpenCode](https://opencode.ai).**
