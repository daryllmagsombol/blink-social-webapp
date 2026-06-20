# PostgreSQL + Prisma Concepts

---

## Part 1: PostgreSQL

PostgreSQL is a relational database. It stores data in **tables** with **rows** and **columns**, connected through **foreign keys**.

### Key Concepts

**Tables** — entities like `User`, `Post`, `Like`
**Columns** — fields like `id`, `email`, `password`
**Rows** — individual records
**Primary Keys** — unique identifier for each row (`id`)
**Foreign Keys** — reference to another table's primary key (`userId` → `User.id`)
**Relationships** — one-to-many (User has many Posts), many-to-many (Post ↔ Tag)

### Relationships in This Project

```
User ──< Post          (one user, many posts)
Post ──< Like          (one post, many likes)
User ──< Follow        (self-referential: one user follows many users)
Post >──< Tag          (many-to-many via join table _PostToTag)
```

### Self-Referential Relationship (Follows)

The `Follow` table connects users to other users:
```prisma
model Follow {
  followerId  String   // who followed
  followingId String   // who was followed
  follower    User  @relation("follower", fields: [followerId], references: [id])
  following   User  @relation("following", fields: [followingId], references: [id])
}
```

### One-to-Many Pattern

```prisma
model User {
  posts Post[]  // user.posts — all posts by this user
}

model Post {
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

The `onDelete: Cascade` means: when a user is deleted, all their posts are deleted too.

### Many-to-Many (Post ↔ Tag)

Prisma's implicit many-to-many:
```prisma
model Post {
  tags Tag[]
}

model Tag {
  posts Post[]
}
```

Prisma auto-creates a join table `_PostToTag` with foreign keys to both tables.

### Why PostgreSQL?

- **Reliable** — ACID compliant, battle-tested
- **JSON support** — can store/query JSON columns
- **Full-text search** — used in the search feature
- **Mature** — extensive tooling (Prisma, pgAdmin, etc.)

---

## Part 2: Prisma ORM

Prisma is a **TypeScript-first ORM**. You define your schema in a declarative file, and it generates a type-safe client.

### Workflow

```
1. Edit schema.prisma → 2. prisma generate → 3. Use generated client in code
                                               ↓
                                        Type-safe queries
                                        with autocomplete
```

### Schema File (`packages/database/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated"   // where the client is generated
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // from .env
}

model User {
  id        String   @id @default(cuid())  // cuid() generates unique IDs
  username  String   @unique               // UNIQUE constraint
  email     String   @unique
  password  String
  createdAt DateTime @default(now())       // auto-set on create
  updatedAt DateTime @updatedAt            // auto-updated
}
```

### Generated Client

Prisma generates a client with full TypeScript types:

```typescript
import { PrismaClient } from '@social/database';

const prisma = new PrismaClient();

// CREATE
await prisma.user.create({
  data: { username: 'john', email: 'john@test.com', password: 'hashed' },
});

// READ (find unique by ID)
await prisma.post.findUnique({ where: { id: 'abc' } });

// READ (find many)
await prisma.post.findMany({
  where: { userId: { in: followingIds } },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
  include: {
    user: { select: { id: true, username: true } },
    tags: { select: { name: true } },
    _count: { select: { likes: true, comments: true } },
  },
});

// COUNT
await prisma.post.count({ where: { userId: userId } });

// UPDATE
await prisma.post.update({
  where: { id: 'abc' },
  data: { caption: 'New caption' },
});

// DELETE
await prisma.post.delete({ where: { id: 'abc' } });

// UPSERT (create or update)
await prisma.tag.upsert({
  where: { name: 'javascript' },
  create: { name: 'javascript' },
  update: {},
});

// TRANSACTION (race-condition safe)
// Handled inline — Prisma wraps single operations in transactions
```

### Where to Use .findUnique vs .findFirst

| Method | What it does |
|--------|-------------|
| `findUnique` | Looks up by a `@unique` field (id, email). Fast. |
| `findFirst` | Looks up by any field/condition. Slower. |
| `findMany` | Returns multiple records. |

### Nested Queries

```typescript
// Create a post AND connect existing tags in one call
await prisma.post.create({
  data: {
    imageUrl: '/uploads/img.jpg',
    userId: user.id,
    tags: {
      connect: tagNames.map(name => ({ name })),  // connect existing tags
    },
  },
});
```

### Pagination Pattern

```typescript
async function getFeed(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where: { ... },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { ... } }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    hasMore: skip + limit < total,  // tells frontend if more pages exist
  };
}
```

### Error Handling (P2002 Race Condition)

Prisma throws errors with code `P2002` for unique constraint violations. Used intentionally:

```typescript
try {
  return await prisma.conversation.create({ data: { id: convId, ... } });
} catch (err: any) {
  if (err?.code === 'P2002') {
    // Another concurrent request created this first — fetch the existing one
    return prisma.conversation.findUniqueOrThrow({ where: { id: convId } });
  }
  throw err;
}
```

### How Prisma Fits in NestJS

```typescript
// prisma.service.ts — wraps PrismaClient as a NestJS provider
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();  // connects to DB when server starts
  }
}

// prisma.module.ts — global module, available to all features
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Any service then injects it:
```typescript
@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}
  // this.prisma.post.findMany(...)
}
```

### Commands

```bash
pnpm db:generate    # Generate Prisma Client after schema changes
pnpm db:push        # Push schema to DB (dev only, no migration files)
pnpm db:migrate     # Create migration files (use in production)
pnpm db:studio      # Open Prisma Studio (GUI browser for your data)
```

### Key Takeaway

Prisma replaces writing SQL. You define the schema, and it gives you a fully typed client. The mental model is:
1. Define models in `schema.prisma`
2. Run `prisma generate`
3. Use `prisma.user.findMany(...)` with autocomplete
