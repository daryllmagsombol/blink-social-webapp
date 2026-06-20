# Next.js 15 Concepts (App Router)

Next.js is a **React framework** that adds server-side rendering, file-based routing, and build optimizations. The App Router (introduced in Next.js 13) is the modern routing paradigm.

---

## 1. App Router: File-Based Routing

Every file inside `app/` automatically becomes a route. The path is determined by the folder structure.

```
app/
├── layout.tsx          → Root layout (wraps EVERY page)
├── page.tsx            → Route: / (home page)
├── globals.css         → Global styles
├── (auth)/             → Route group (parentheses = no URL segment)
│   ├── layout.tsx      → Auth pages layout
│   ├── login/
│   │   └── page.tsx    → Route: /login
│   └── register/
│       └── page.tsx    → Route: /register
└── (main)/             → Route group
    ├── layout.tsx      → Main app layout (sidebar, auth guard)
    ├── feed/
    │   └── page.tsx    → Route: /feed
    ├── [userId]/       → Dynamic route
    │   └── page.tsx    → Route: /:userId (profile page)
    └── messages/
        └── page.tsx    → Route: /messages
```

### Route Groups (`(auth)`, `(main)`)

Folders wrapped in `()` don't become part of the URL. They exist so you can have **different layouts** for different sections of the app:

- `(auth)/layout.tsx` — No sidebar, just login/register forms
- `(main)/layout.tsx` — Sidebar nav, auth guard, mobile bottom nav

### Dynamic Routes (`[param]`)

Square brackets = dynamic parameter:
```
messages/[userId]/page.tsx  →  /messages/abc123  →  params.userId = "abc123"
```

---

## 2. Layouts (`layout.tsx`)

Layouts persist across pages and **do not re-render** when navigating. This is different from React Router where you'd manually wrap things.

**Root layout** — wraps all pages:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg antialiased">
        <ThemeProvider>
          <ApolloWrapper>
            {children}          {/* Page content injected here */}
          </ApolloWrapper>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Nested layout** — wraps `(main)` pages:
```typescript
export default function MainLayout({ children }) {
  // Auth guard logic here
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
```

Layouts can be either **Server Components** (default, no `'use client'`) or **Client Components**.

---

## 3. Middleware (`middleware.ts`)

Runs at the **edge** (before the page loads) on every request. Used for auth redirects:

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico).*)'],
};
```

The `matcher` tells Next.js which routes the middleware should run on. It excludes API routes and static files.

---

## 4. Client vs Server Components

In the App Router, **all components are Server Components by default**.

| Aspect | Server Component | Client Component |
|--------|-----------------|-----------------|
| Mark | No directive | `'use client'` at top |
| Renders | On server, sends HTML | In browser |
| Hooks | ❌ No hooks | ✅ useState, useEffect, etc. |
| Event handlers | ❌ No onClick | ✅ onClick, onSubmit |
| When to use | Static data, SEO, layout | Interactivity, state |

**In this project**, most pages use `'use client'` because they fetch data in `useEffect` and manage local state. This isn't the full RSC (React Server Components) pattern — it's more like the old Pages Router approach.

---

## 5. Data Fetching Patterns

### Patterns used in this project:

**REST API calls** (most pages):
```typescript
'use client';
const [posts, setPosts] = useState<Post[]>([]);

useEffect(() => {
  api.get('/feed?page=1&limit=10').then(setPosts);
}, []);
```

**GraphQL with Apollo** (chat):
```typescript
const { data, loading } = useQuery(GET_CONVERSATION, {
  variables: { userId: otherUserId, page: 1 },
});
```

**Server-side fetching** (not used here but worth knowing):
```typescript
// In a Server Component (no 'use client'):
export default async function Page() {
  const data = await fetch('http://localhost:4000/api/feed');
  return <div>...</div>;
}
```

---

## 6. Loading & Error States

**loading.tsx** — shown during page load (works with Suspense):
```typescript
export default function Loading() {
  return <PostSkeleton />;
}
```

**error.tsx** — shown when a page crashes (must be `'use client'`):
```typescript
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorDisplay message={error.message} onRetry={reset} />;
}
```

---

## 7. Key Next.js Config

```typescript
// apps/web/next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '4000' }],
  },
};
```

This allows the Next.js `Image` component to optimize images hosted on the backend.

---

## 8. App Router vs Pages Router (React Router)

| Concept | Pages Router / React Router | App Router (this project) |
|---------|---------------------------|--------------------------|
| Routes | Files in `pages/` | Files in `app/` |
| Layouts | Manual wrapper | `layout.tsx` persists |
| Loading | Manual state | `loading.tsx` auto |
| Error | Error boundaries | `error.tsx` auto |
| Data fetch | `useEffect` or `getServerSideProps` | Server Components or `useEffect` |
| Middleware | Custom server | `middleware.ts` at edge |

---

## 9. What You Need to Know

To recreate this from scratch:

1. Create `app/` folder structure with route groups
2. Write `layout.tsx` for shared UI (nav, auth guard)
3. Write `page.tsx` for each route
4. Add `'use client'` for interactive pages
5. Use `middleware.ts` for auth redirects
6. Use `loading.tsx` and `error.tsx` for loading/error states

The App Router's key advantage: layouts that don't remount on navigation, automatic code splitting, and edge middleware.
