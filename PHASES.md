# Blink Social — Phase Plan

## Phase 1: Foundation ✅

Monorepo + DB + auth scaffolding.

- Turborepo scaffold (4 packages: server, web, database, shared)
- Prisma schema (9 models + 1 enum) — pushed to PostgreSQL
- NestJS app module with all feature modules registered
- Auth module: register, login, JWT access + refresh tokens, `auth/me`
- Prisma client generated to `packages/database/src/generated/`
- `.env` config (DATABASE_URL, JWT secrets)
- Uploads module (multer + local storage + static serving)
- docker-compose.yml for PostgreSQL 16

## Phase 2: Core Social Features ✅

Users, posts, likes, comments, follows.

- Users module: profile lookup by ID/username, update profile
- Posts module: CRUD, image upload, feed (chronological from followed), explore (all posts), user posts
- Likes module: like/unlike, count, status check — auto-creates LIKE notification
- Comments module: create, list, delete — auto-creates COMMENT notification
- Follows module: follow/unfollow, followers/following lists, status check — auto-creates FOLLOW notification
- Frontend: auth pages (login/register), sidebar layout, feed with post cards + story bar, explore grid, profile (own + other), post detail with comments, create post
- Zustand auth store + custom fetch wrapper with 401 auto-refresh

## Phase 3: Real-time & Notifications ✅

Stories, DMs via WebSocket, notification system.

- Stories module: create, list following (grouped by user, unexpired), mark viewed, delete, 24h expiry
- Messages module: send, get conversation, list conversations
- Chat WebSocket gateway (`/chat` namespace): JWT auth, `send_message` → `new_message` event
- Notifications module: list, mark read, mark all read, unread count
- Frontend: story viewer (progress bar + auto-advance), messages list + chat UI, notifications list
- Socket.IO client: singleton connection, emits on send, listens on `new_message`
- Middleware cookie fix: `setTokens` writes `document.cookie` alongside `localStorage`

## Phase 4: Polish & UX ✅

Loading states, error boundaries, skeletons, infinite scroll, empty states, toasts.

- UI primitives: Skeleton, EmptyState, ErrorDisplay, Toast (Zustand-based)
- Skeleton components: PostSkeleton, GridSkeleton, ProfileSkeleton, MessageSkeleton, NotificationSkeleton
- Route-level loading.tsx + error.tsx for both auth and main route groups
- Infinite scroll (IntersectionObserver) on feed + explore pages
- Empty states on all pages (feed, explore, profile, notifications, messages, followers/following)
- Toast notifications on like errors, follow, post create/delete
- Sidebar polish: active states, gradient avatar initials, Messages nav item, fixed positioning with `md:ml-64`
- Auth pages: auto-redirect when authenticated, spinner in submit buttons

## Phase 5: Search & Hashtags ✅

Search users/posts, hashtag parsing, trending tags.

- Tag model (many-to-many with Post) added to Prisma schema, DB pushed
- Hashtag parsing: `#word` regex extraction, upsert Tag, connect on post creation
- Search endpoint: case-insensitive `contains` on username/displayName/caption
- Tags endpoints: trending (top 10 by post count), posts by tag
- Frontend: search page (debounced 300ms, users + posts results), tags/[tag] page
- Hashtag linkifier: `linkifyCaption()` renders `#tag` as clickable Link
- Trending tags section on explore page
- Message button on user profile pages

## Phase 6: Bookmarks / Saved ✅

SavedPost model, save/unsave, saved list page.

| Task                                                     | Status |
| -------------------------------------------------------- | ------ |
| SavedPost model (userId + postId unique)                 | Done   |
| Bookmark endpoints (save/unsave, list saved, check)      | Done   |
| Save button on feed + post detail (lucide Bookmark icon) | Done   |
| `/bookmarks` page (3-col grid, infinite scroll)          | Done   |
| Sidebar nav item + Saved link                            | Done   |

## Phase 7: Edit & Delete Features ✅

Edit posts/comments, delete account.

| Task                                           | Status |
| ---------------------------------------------- | ------ |
| Edit post caption endpoint + tag re-parse      | Done   |
| Edit comment endpoint                          | Done   |
| Delete account endpoint (cascade all data)     | Done   |
| Frontend edit caption UI on post detail        | Done   |
| Frontend edit comment UI on post detail        | Done   |
| Frontend delete account UI in profile settings | Done   |

## Phase 8: Blocking & Privacy ✅

Block users, private accounts, report content.

| Task                                             | Status |
| ------------------------------------------------ | ------ |
| Block model + CRUD endpoints                     | Done   |
| Private account toggle (isPrivate field + PATCH) | Done   |
| Report model + POST endpoint                     | Done   |
| Blocked user filtering in feed + search          | Done   |
| Private account post visibility in profile       | Done   |
| Block/unblock UI on user profile                 | Done   |
| Private account toggle UI in profile settings    | Done   |
| Report button on post detail                     | Done   |

## Phase 9: Auth Enhancements

**Not started.** Email verification, password reset, OAuth.

| Task                                                  | Status  |
| ----------------------------------------------------- | ------- |
| Email verification flow (send email, verify endpoint) | Pending |
| Password reset (request + confirm endpoints)          | Pending |
| OAuth (Google/GitHub) via Passport strategies         | Pending |
| Frontend email verify / reset password pages          | Pending |
| OAuth callback pages                                  | Pending |
