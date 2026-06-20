# React 19 Concepts

React is a UI library for building component-based user interfaces. This project uses **React 19** with a mix of classic patterns and modern hooks.

---

## 1. Components & JSX

Components are reusable UI pieces. Every component is a function that returns JSX.

```typescript
// Simple component
function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="rounded-full w-10 h-10" />;
}
```

**JSX rules:**
- One root element (or use `<> </>` fragments)
- Use `className` instead of `class`
- Curly braces `{}` for JavaScript expressions
- Self-closing tags: `<Avatar />`

---

## 2. Props

Props are read-only input to components.

```typescript
// Defining props with TypeScript
interface PostCardProps {
  post: Post;
  liked: boolean;
  onToggleLike: (postId: string) => void;
}

function PostCard({ post, liked, onToggleLike }: PostCardProps) {
  return (
    <div>
      <button onClick={() => onToggleLike(post.id)}>
        {liked ? '❤️' : '🤍'}
      </button>
    </div>
  );
}
```

---

## 3. State Management in This Project

### useState — Local component state

Used for form inputs, toggles, and data that belongs to one component:

```typescript
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);
const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
const [page, setPage] = useState(1);
```

### useCallback — Memoized functions

Prevents unnecessary re-renders when passing functions as props:

```typescript
const loadFeed = useCallback(async (pageNum: number) => {
  const res = await api.get(`/feed?page=${pageNum}`);
  setPosts(res.data);
}, []);  // dependencies array — empty = never re-creates
```

### useEffect — Side effects

Runs after render. Used for data fetching, subscriptions, or syncing with external systems:

```typescript
useEffect(() => {
  loadFeed(1);
  loadStories();
}, [loadFeed, loadStories]);  // runs when loadFeed or loadStories changes
```

---

## 4. Custom Hooks

Reusable logic extracted into functions. This project has:

```typescript
// hooks/use-conversation.ts — encapsulates all chat logic
export function useConversation(otherUserId: string, currentUserId: string) {
  const { data, loading, fetchMore } = useQuery(GET_CONVERSATION, ...);
  useSubscription(ON_NEW_MESSAGE, { onData: ... });

  const send = useCallback(async (content: string) => { ... }, []);
  const loadMore = useCallback(() => { ... }, []);

  return { messages: data?.conversation?.data ?? [], loading, send, loadMore };
}

// Usage in a component:
const { messages, loading, send, loadMore } = useConversation(userId, currentUser.id);
```

Custom hooks are the primary way to share stateful logic between components.

---

## 5. State Management Beyond Local State

Three layers of state in this project:

| Layer | Tool | Scope |
|-------|------|-------|
| Auth state | **Zustand** (`stores/auth.ts`) | Global — user, login, logout |
| Server cache | **Apollo Client** (`InMemoryCache`) | GraphQL query results |
| UI state | **React useState** | Per-component: forms, modals, toggles |

### Zustand (global state)

```typescript
export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email, password) => { ... },
  logout: () => { ... },
}));

// In any component:
const { user, isLoading, login } = useAuth();
```

Zustand is simpler than Redux — no providers, no reducers, no action types. Just a store with functions that call `set()`.

---

## 6. Forms & Validation

### Controlled Inputs

```typescript
const [email, setEmail] = useState('');
return <input value={email} onChange={(e) => setEmail(e.target.value)} />;
```

### Form Submit Pattern

```typescript
const submitComment = async (postId: string, e: React.FormEvent) => {
  e.preventDefault();
  const text = commentInputs[postId]?.trim();
  if (!text) return;

  setSubmitting(prev => new Set(prev).add(postId));  // loading state
  try {
    await api.post(`/posts/${postId}/comments`, { content: text });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    toast('Comment added', 'success');
  } catch {
    toast('Failed to add comment', 'error');
  } finally {
    setSubmitting(prev => { const n = new Set(prev); n.delete(postId); return n; });
  }
};
```

---

## 7. Event Handling

```typescript
// Button click
<button onClick={() => toggleLike(post.id)}>

// Form submit
<form onSubmit={(e) => submitComment(post.id, e)}>

// Input change
<input onChange={(e) => setCommentInputs(prev => ({ ...prev, [postId]: e.target.value }))}>

// Infinite scroll — sentinel element
<div ref={sentinelRef} />  // IntersectionObserver sees this → loads more
```

---

## 8. Conditional Rendering

```typescript
// Ternary
{loading ? <Spinner /> : <PostCard />}

// Logical AND
{showCreator && <StoryCreator onClose={() => setShowCreator(false)} />}

// If/else pattern
if (loading) return <Skeleton />;
if (!isAuthenticated) return null;
return <div>Content</div>;
```

---

## 9. Lists & Keys

Every mapped element needs a unique `key`:

```typescript
{posts.map((post) => (
  <PostCard key={post.id} post={post} ... />
))}
```

Without keys, React can't track which items changed, added, or removed.

---

## 10. TypeScript with React

This project uses TypeScript throughout:

```typescript
interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
  isLiked?: boolean;
}

// Generic useState
const [posts, setPosts] = useState<Post[]>([]);

// Generic API wrapper
const res = await api.get<{ data: Post[]; hasMore: boolean }>('/feed');
```

---

## 11. React 19 Specifics

React 19 introduced:
- **Improved hooks** (no behavioral changes for this project's patterns)
- Experimental features like Server Components (used implicitly via Next.js App Router)
- The same `useState`, `useEffect`, `useCallback` hooks work as in React 18

---

## Key Takeaways

1. **State lives in components** — lift it up to share, keep it local otherwise
2. **Zustand for global auth** — simple, no boilerplate
3. **Apollo for server state** — cache + subscriptions handled automatically
4. **Custom hooks** are the primary code reuse mechanism
5. **TypeScript** props with interfaces for type safety
