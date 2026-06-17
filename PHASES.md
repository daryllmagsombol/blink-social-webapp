# 🔮 Blink Social — Phase Plan

## 📦 Phase 1: Foundation ✅

🏗 Monorepo + DB + auth scaffolding.

- 📦 Turborepo scaffold (4 packages: server, web, database, shared)
- 🗄 Prisma schema (9 models + 1 enum) — pushed to PostgreSQL
- ⚙️ NestJS app module with all feature modules registered
- 🔐 Auth module: register, login, JWT access + refresh tokens, `auth/me`
- 🔄 Prisma client generated to `packages/database/src/generated/`
- 🔑 `.env` config (DATABASE_URL, JWT secrets)
- 📤 Uploads module (multer + local storage + static serving)
- 🐳 docker-compose.yml for PostgreSQL 16

## ❤️ Phase 2: Core Social Features ✅

👥 Users, posts, likes, comments, follows.

- 👤 Users module: profile lookup by ID/username, update profile
- 📝 Posts module: CRUD, image upload, feed (chronological from followed), explore (all posts), user posts
- ❤️ Likes module: like/unlike, count, status check — auto-creates LIKE notification
- 💬 Comments module: create, list, delete — auto-creates COMMENT notification
- ➕ Follows module: follow/unfollow, followers/following lists, status check — auto-creates FOLLOW notification
- 🖼 Frontend: auth pages (login/register), sidebar layout, feed with post cards + story bar, explore grid, profile (own + other), post detail with comments, create post
- 🗃 Zustand auth store + custom fetch wrapper with 401 auto-refresh

## ⚡ Phase 3: Real-time & Notifications ✅

📖 Stories, DMs via WebSocket, notification system.

- 📖 Stories module: create, list following (grouped by user, unexpired), mark viewed, delete, 24h expiry
- ✉️ Messages module: send, get conversation, list conversations
- 🔌 Chat WebSocket gateway (`/chat` namespace): JWT auth, `send_message` → `new_message` event
- 🔔 Notifications module: list, mark read, mark all read, unread count
- 🖥 Frontend: story viewer (progress bar + auto-advance), messages list + chat UI, notifications list
- 🔗 Socket.IO client: singleton connection, emits on send, listens on `new_message`
- 🍪 Middleware cookie fix: `setTokens` writes `document.cookie` alongside `localStorage`

## ✨ Phase 4: Polish & UX ✅

💅 Loading states, error boundaries, skeletons, infinite scroll, empty states, toasts.

- 🧩 UI primitives: Skeleton, EmptyState, ErrorDisplay, Toast (Zustand-based)
- 💀 Skeleton components: PostSkeleton, GridSkeleton, ProfileSkeleton, MessageSkeleton, NotificationSkeleton
- 🚏 Route-level loading.tsx + error.tsx for both auth and main route groups
- 🔄 Infinite scroll (IntersectionObserver) on feed + explore pages
- 📭 Empty states on all pages (feed, explore, profile, notifications, messages, followers/following)
- 🍞 Toast notifications on like errors, follow, post create/delete
- 🎨 Sidebar polish: active states, gradient avatar initials, Messages nav item, fixed positioning with `md:ml-64`
- 🔁 Auth pages: auto-redirect when authenticated, spinner in submit buttons

## 🔍 Phase 5: Search & Hashtags ✅

🔎 Search users/posts, hashtag parsing, trending tags.

- 🏷 Tag model (many-to-many with Post) added to Prisma schema, DB pushed
- #️⃣ Hashtag parsing: `#word` regex extraction, upsert Tag, connect on post creation
- 🔍 Search endpoint: case-insensitive `contains` on username/displayName/caption
- 📊 Tags endpoints: trending (top 10 by post count), posts by tag
- 🖥 Frontend: search page (debounced 300ms, users + posts results), tags/[tag] page
- 🔗 Hashtag linkifier: `linkifyCaption()` renders `#tag` as clickable Link
- 🔥 Trending tags section on explore page
- ✉️ Message button on user profile pages

## 🔖 Phase 6: Bookmarks / Saved ✅

📑 SavedPost model, save/unsave, saved list page.

| Task                                                     | Status |
| -------------------------------------------------------- | ------ |
| SavedPost model (userId + postId unique)                 | ✅ Done |
| Bookmark endpoints (save/unsave, list saved, check)      | ✅ Done |
| 🔖 Save button on feed + post detail (lucide Bookmark icon) | ✅ Done |
| 📂 `/bookmarks` page (3-col grid, infinite scroll)       | ✅ Done |
| 📋 Sidebar nav item + Saved link                         | ✅ Done |

## ✏️ Phase 7: Edit & Delete Features ✅

📝 Edit posts/comments, delete account.

| Task                                           | Status |
| ---------------------------------------------- | ------ |
| Edit post caption endpoint + tag re-parse      | ✅ Done |
| Edit comment endpoint                          | ✅ Done |
| 🗑 Delete account endpoint (cascade all data)  | ✅ Done |
| 🖥 Frontend edit caption UI on post detail      | ✅ Done |
| 🖥 Frontend edit comment UI on post detail      | ✅ Done |
| 🖥 Frontend delete account UI in profile settings | ✅ Done |

## 🚫 Phase 8: Blocking & Privacy ✅

🔒 Block users, private accounts, report content.

| Task                                             | Status |
| ------------------------------------------------ | ------ |
| 🚫 Block model + CRUD endpoints                  | ✅ Done |
| 🔐 Private account toggle (isPrivate field + PATCH) | ✅ Done |
| 📋 Report model + POST endpoint                  | ✅ Done |
| 🚫 Blocked user filtering in feed + search       | ✅ Done |
| 👁 Private account post visibility in profile    | ✅ Done |
| 🖥 Block/unblock UI on user profile              | ✅ Done |
| 🖥 Private account toggle UI in profile settings | ✅ Done |
| 🖥 Report button on post detail                  | ✅ Done |

## 📧 Phase 9: Auth Enhancements ✅

📧 Email verification, password reset (OAuth pending — needs Google/GitHub API keys).

| Task                                                  | Status |
| ----------------------------------------------------- | ------ |
| 📧 Email verification flow (token gen, verify endpoint) | ✅ Done |
| 🔑 Password reset (forgot + reset endpoints with expiry) | ✅ Done |
| 🔄 Resend verification endpoint                       | ✅ Done |
| 🖥 Frontend verify-email page                         | ✅ Done |
| 🖥 Frontend forgot-password page                      | ✅ Done |
| 🖥 Frontend reset-password page                       | ✅ Done |
| 🔗 "Forgot password?" link on login page              | ✅ Done |
| 📇 `emailVerified` field in JWT + auth store          | ✅ Done |
| 🌐 OAuth (Google/GitHub) via Passport strategies      | ✅ Done |

## 🎨 Phase 10: Design System & Component Library ✅

🎯 Brand identity, dark mode, reusable component library.

| Task                                                       | Status |
| ---------------------------------------------------------- | ------ |
| 🎯 Brand color tokens (Purple/Blue/Pink) + CSS variables   | ✅ Done |
| 🌙 Dark mode via `.dark` class + CSS variable overrides     | ✅ Done |
| 🌗 ThemeProvider with localStorage persistence + context    | ✅ Done |
| 🌓 Dark mode toggle in sidebar + mobile nav                 | ✅ Done |
| 📐 Typography, spacing, radius, shadow scales               | ✅ Done |
| 🔗 `cn()` utility + `Spinner` component                    | ✅ Done |
| 🔘 `Button` (5 variants, 3 sizes, loading + icon)          | ✅ Done |
| ⌨️ `Input` / `Textarea` (label, error, helperText)         | ✅ Done |
| 👤 `Avatar` (5 sizes, fallback initials, online dot, gradientBorder) | ✅ Done |
| 🏷 `Badge` (6 variants) + `Toggle` (switch)                | ✅ Done |
| 🃏 `Card` (3 variants) + `Modal` (3 sizes, backdrop)       | ✅ Done |
| 📑 `Tabs` (underline + pill) + `DropdownMenu` + `Tooltip`  | ✅ Done |
| 💀 Upgraded `Skeleton`, `EmptyState`, `ErrorDisplay`, `Toast` | ✅ Done |
| 🔁 Migrated auth pages to use new components               | ✅ Done |
| 🖼 Logo integration on auth pages                           | ✅ Done |
| 📝 `DESIGN-SYSTEM.md` documentation                        | ✅ Done |
| 🖼 `<Image>` exclusion in middleware for `/images/`        | ✅ Done |

## 🛡️ Phase 11: Security, Polish & UX Enhancements ✅

🔒 Security hardening, form validation, user suggestions, performance optimization.

| Task                                                           | Status |
| -------------------------------------------------------------- | ------ |
| 🚦 Rate limiting (ThrottlerGuard: 120/min global, strict auth) | ✅ Done |
| 🔒 Content Security Policy (CSP) tightened                     | ✅ Done |
| 🍪 Secure cookie configuration                                 | ✅ Done |
| 🔑 OAuth token hashing (Google & GitHub tokens)                | ✅ Done |
| 📝 Frontend form validation (React Hook Form + Zod)            | ✅ Done |
| 👥 Suggested users on feed sidebar                             | ✅ Done |
| 💬 Message search & conversation search                        | ✅ Done |
| ⚡ Feed query optimization (include likes & bookmarks)         | ✅ Done |
| 📐 ESLint config fixes + type safety                           | ✅ Done |
| 🔧 Various UI/UX bug fixes (responsiveness, avatars, spacing)  | ✅ Done |

## ☁️ Phase 12: Deployment & Infrastructure ✅

🚀 Production deployment to Azure VM with Docker Compose and nginx.

| Task                                                             | Status |
| ---------------------------------------------------------------- | ------ |
| 🏗 Azure VM provisioning (`Standard_B2s`, Ubuntu LTS)            | ✅ Done |
| 🐳 Docker Compose setup (PostgreSQL, apps, nginx)                | ✅ Done |
| 🌐 nginx reverse proxy with Cloudflare DNS                       | ✅ Done |
| 🔐 Cloudflare SSL (Full/Strict)                                  | ✅ Done |
| 🔑 `.env` + SESSION_SECRET configuration                         | ✅ Done |
| 🔁 GitHub Actions CI/CD (SSH deploy on push to `main`)          | ✅ Done |
| 📤 Uploads path resolution in production                         | ✅ Done |

## 🚀 What's next?

📦 Ideas for future iteration:
- 🧪 End-to-end testing (Playwright / Cypress)
- 📱 Push notifications (Web Push API)
- 🎥 Video uploads for posts
- 📊 Admin dashboard / moderation panel
- 🌐 i18n / multi-language support
- 📈 Analytics / insights for users
