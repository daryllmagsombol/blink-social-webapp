# Tooling & Libraries Concepts

---

## 1. Monorepo — Turborepo + pnpm

### Why Monorepo?

Multiple projects (frontend, backend, shared packages) in one repo. Benefits:
- **Shared code** — types (`@social/shared`), database client (`@social/database`)
- **Single source of truth** — one PR changes frontend + backend
- **Consistent tooling** — one ESLint config, one TypeScript version
- **Dependency management** — pnpm resolves shared deps to one version

### pnpm Workspaces (`pnpm-workspace.yaml`)

```yaml
packages:
  - "apps/*"       # apps/web, apps/server
  - "packages/*"   # packages/database, packages/shared
```

Packages reference each other with `workspace:*`:

```json
// apps/server/package.json
"dependencies": {
  "@social/database": "workspace:*",
  "@social/shared": "workspace:*"
}
```

The `workspace:*` means "use the local package, not a published npm version."

### Turborepo (`turbo.json`)

Task runner that knows about dependencies:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],   // build dependencies first
    },
    "typecheck": {
      "dependsOn": ["^build"],   // ensure deps are built before type checking
    }
  }
}
```

`^build` means "run build in dependency packages first." So `pnpm build` will:
1. Build `@social/database` (Prisma generate)
2. Build `@social/shared` (TypeScript compile)
3. Build `apps/server` and `apps/web` (in parallel, they don't depend on each other)

**Commands:**
```bash
pnpm dev             # Start both server (port 4000) and frontend (port 3000)
pnpm --filter @social/server dev   # Start only the server
pnpm --filter @social/web dev      # Start only the frontend
```

---

## 2. Zustand (State Management)

Zustand is a lightweight state management library. Think of it as a **global useState**.

```typescript
import { create } from 'zustand';

// Define the store shape + actions
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the store
export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, tokens } = await api.post('/auth/login', { email, password });
    setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearTokens();
    resetApolloClient();  // also kills WebSocket
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
```

**Usage in components:**
```typescript
const { user, isLoading, login } = useAuth();
```

**Key differences from Redux:**
- No Provider needed (no `<Provider>` wrapper)
- No reducers, no actions, no dispatch
- Just `create()` → returns a hook → call `set()` to update
- TypeScript inferred types automatically

---

## 3. Apollo Client (GraphQL Client)

Apollo Client is the frontend GraphQL client.

### How it's set up:

```typescript
// lib/apollo-client.ts
const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });
const wsLink = new GraphQLWsLink(createClient({
  url: `${WS_URL}/graphql`,
  connectionParams: () => ({ token: localStorage.getItem('accessToken') }),
}));

// Split: subscriptions go via WebSocket, everything else via HTTP
const splitLink = split(
  ({ query }) => getMainDefinition(query).operation === 'subscription',
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      // Custom merge logic for paginated data
      Query: {
        fields: {
          conversation: {
            keyArgs: ['userId'],
            merge(existing, incoming, { args }) {
              if (!args?.page || args.page === 1) return incoming;
              return { ...incoming, data: [...incoming.data, ...existing.data] };
            },
          },
        },
      },
    },
  }),
});
```

### Cache Merge Logic Explained

When fetching page 2 of messages (older messages), the server returns them. The `merge` function controls how they combine with existing page 1 data:

- **page 1** (newest messages): replace cache entirely
- **page 2+** (older messages): prepend older data before newer data (since messages load newest-first from server but display oldest-first)

### Optimistic Responses

Show the mutation result instantly before the server responds:
```typescript
sendMessageMutation({
  variables: { receiverId, content },
  optimisticResponse: {
    __typename: 'Mutation',
    sendMessage: {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUserId,
      read: false,
    },
  },
});
```

---

## 4. Tailwind CSS v4

Tailwind is a **utility-first CSS framework**. Instead of writing custom CSS, you compose styles with predefined classes.

```typescript
// Instead of:
// .card { background: white; padding: 16px; border-radius: 8px; }

// You write:
<div className="bg-bg p-4 rounded-lg shadow-sm">
```

### CSS Variable Tokens (v4 feature)

This project defines semantic color tokens in `globals.css`:

```css
:root {
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F7F8FC;
  --color-text: #0F1226;
  --color-brand: #8A2EFF;
  --color-primary: #00B7FF;
  --color-accent: #FF2BA6;
}

.dark {
  --color-bg: #0F1226;
  --color-bg-secondary: #1A1E35;
  --color-text: #F7F8FC;
  --color-brand: #A24BFF;
}
```

Usage: `className="bg-bg text-text border-border"`

**Key insight:** You never use `dark:` prefix for these core tokens. The CSS variable changes automatically when `.dark` class toggles.

### Common patterns:

```typescript
// Layout
<div className="flex items-center justify-between" />

// Spacing (4px base)
<p className="p-4" />     // padding: 16px
<p className="mt-2" />    // margin-top: 8px
<p className="gap-3" />   // gap: 12px

// Colors
<span className="text-text-secondary" />
<span className="text-brand" />
<span className="bg-danger" />

// Responsive (mobile-first)
<div className="w-full lg:w-1/2" />    // full width on mobile, half on desktop
<div className="hidden lg:flex" />      // hidden on mobile, flex on desktop

// Hover
<button className="hover:bg-bg-tertiary transition-colors" />
```

---

## 5. Other Libraries

### lucide-react (Icons)
```typescript
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
<Heart className="text-accent" />
```

Used alongside Google Material Symbols (`material-symbols-outlined` font).

### bcryptjs (Password Hashing)
```typescript
import * as bcrypt from 'bcryptjs';

const hash = await bcrypt.hash(password, 12);         // hash on register
const valid = await bcrypt.compare(password, hash);    // compare on login
```

### passport-jwt (JWT Auth Strategy)
```typescript
// Verify JWT from Authorization header
new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.get('JWT_SECRET'),
}, (payload, done) => {
  // payload = { sub: userId, email }
  done(null, { id: payload.sub, email: payload.email });
});
```

### helmet (Security Headers)
```typescript
app.use(helmet());
```
Sets security HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.).

### multer (File Uploads)
```typescript
// Multer handles multipart/form-data for image uploads
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {
  return { url: `/uploads/${file.filename}` };
}
```

### class-validator + class-transformer (DTO Validation)
```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

Combined with NestJS `ValidationPipe` using `transform: true`, strings like `"5"` become numbers.

### socket.io (Legacy Real-Time)
```typescript
// Legacy — being replaced by GraphQL subscriptions
// Client:
const socket = io('http://localhost:4000/chat', { auth: { token: jwt } });
socket.emit('sendMessage', { receiverId, content });
socket.on('newMessage', (msg) => { ... });
```

Still kept as fallback but all new real-time features use GraphQL subscriptions.

### graphql-ws (WebSocket Protocol for GraphQL)
The modern WebSocket protocol for GraphQL subscriptions. Replaces the older `subscriptions-transport-ws`.

### ioredis (Redis Client)
```typescript
// Used in production for Redis PubSub (scaling subscriptions across instances)
// Dev uses in-memory PubSub
const RedisPubSub = require('graphql-redis-subscriptions').RedisPubSub;
const pubSub = new RedisPubSub({ ... });
```

---

## 6. TypeScript Everywhere

This project uses TypeScript throughout both frontend and backend.

### Interfaces for API responses
```typescript
interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  _count: { likes: number; comments: number };
  isLiked?: boolean;
}
```

### Generic API wrapper
```typescript
api.get<{ data: Post[]; hasMore: boolean }>('/feed');
```

### Strict mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Shared types package
```typescript
// packages/shared/src/types.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

Imported as `@social/shared` in both `apps/server` and `apps/web`.

---

## 7. Docker + PostgreSQL

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: social_user
      POSTGRES_PASSWORD: social_pass
      POSTGRES_DB: social_media
    ports:
      - "5432:5432"
```

Run once: `docker compose up -d` to start the database. The Node apps run locally (no Docker for them in development).
