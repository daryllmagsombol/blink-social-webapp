# GraphQL Concepts

GraphQL is an API query language and runtime. Unlike REST (many endpoints returning fixed shapes), GraphQL has **one endpoint** where clients ask for exactly what they need.

---

## 1. Core Concepts

### Schema Definition

Every GraphQL API has a **schema** that defines what data is available:

```graphql
# Auto-generated from TypeScript decorators (Code-First approach)
type Query {
  conversations: [ConversationType!]!
  conversation(userId: String!, page: Int): PaginatedMessageType!
}

type Mutation {
  sendMessage(receiverId: String!, content: String!): MessageEventType!
  markAsRead(userId: String!): Boolean!
}

type Subscription {
  newMessage: MessageEventType!
  messageRead: MessageReadEventType!
}
```

### Queries — Fetching Data (GET equivalent)

```graphql
query GetConversation($userId: String!, $page: Int) {
  conversation(userId: $userId, page: $page) {
    data {
      id
      content
      createdAt
      sender { id username avatarUrl }
    }
    hasMore
  }
}
```

Client asks for exactly these fields. No over-fetching.

### Mutations — Writing Data (POST/PUT/DELETE equivalent)

```graphql
mutation SendMessage($receiverId: String!, $content: String!) {
  sendMessage(receiverId: $receiverId, content: $content) {
    id
    content
    createdAt
    read
  }
}
```

Returns the created/updated data so the client can update its cache.

### Subscriptions — Real-time Data (WebSocket equivalent)

```graphql
subscription OnNewMessage {
  newMessage {
    id
    content
    senderId
    sender { id username }
    receiver { id username }
  }
}
```

Opens a WebSocket. Server pushes data when events occur.

---

## 2. How It Works in This Project

### Code-First Approach

NestJS decorators define the GraphQL schema from TypeScript:

```typescript
// types/message.type.ts
@ObjectType()                       // ← defines a GraphQL type
export class MessageEventType {
  @Field()                          // ← defines a field
  id: string;

  @Field()
  content: string;

  @Field(() => UserType)            // ← nested type
  sender: UserType;
}

// resolvers/messages.resolver.ts
@Resolver(() => MessageEventType)
export class MessagesResolver {
  @Query(() => [ConversationType])              // defines a query
  @UseGuards(GqlAuthGuard)
  async conversations(@GqlCurrentUser() user: { id: string }) {
    return this.messagesService.getConversations(user.id);
  }

  @Mutation(() => MessageEventType)             // defines a mutation
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @Args('receiverId') receiverId: string,
    @Args('content') content: string,
    @GqlCurrentUser() user: { id: string },
  ) {
    const message = await this.messagesService.send(user.id, receiverId, content);
    // Publish to subscribers
    await this.pubSub.instance.publish('NEW_MESSAGE', { newMessage: message });
    return message;
  }

  @Subscription(() => MessageEventType, {
    filter: (payload, variables, context) => {
      // Only deliver if I'm the sender or receiver
      const user = context.req.user;
      return message.senderId === user.id || message.receiverId === user.id;
    },
  })
  newMessage() {
    return this.pubSub.instance.asyncIterableIterator('NEW_MESSAGE');
  }
}
```

### Apollo Server Setup (NestJS)

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useFactory: (config, jwt) => ({
    autoSchemaFile: join(process.cwd(), '.../schema.gql'),  // auto-generates
    sortSchema: true,

    subscriptions: {
      'graphql-ws': {
        onConnect: async (context) => {
          // Verify JWT from WebSocket connectionParams
          const token = context.connectionParams?.token;
          const payload = await jwt.verifyAsync(token, { secret: JWT_SECRET });
          context.extra.request.user = { id: payload.sub };
        },
      },
    },
  }),
});
```

---

## 3. GraphQL vs REST in This Project

| Aspect | REST | GraphQL |
|--------|------|---------|
| Used for | Auth, posts, likes, comments, follow, stories, notifications, search, uploads | Real-time chat |
| Endpoint | `/api/posts`, `/api/feed`, etc. | `/graphql` |
| Transport | HTTP | HTTP + WebSocket |
| Auth | `Authorization` header | Header (query/mutation) + `connectionParams` (subscription) |

The project uses **dual mode** — REST for most features, GraphQL only for chat. This is a common migration pattern.

---

## 4. PubSub — The Event System

GraphQL subscriptions need a publish/subscribe system:

```typescript
// In-memory PubSub for development
const pubSub = new PubSub();

// Redis PubSub for production (scales across multiple server instances)
// const pubSub = new RedisPubSub({ ... });
```

**Flow:**
```
User A sends message
  → sendMessage mutation
  → MessagesService.send() → Prisma (save to DB)
  → PubSub.publish('NEW_MESSAGE', { newMessage })
  → GraphQL push to all subscribed clients
  → User B's subscription filter checks: "am I the receiver?" → YES → deliver
  → User A's subscription filter checks: "am I the sender?" → YES → deliver (echo)
```

---

## 5. Apollo Client (Frontend)

### Split Link

The frontend uses a **split link**: HTTP for queries/mutations, WebSocket for subscriptions:

```typescript
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.operation === 'subscription';
  },
  wsLink,     // WebSocket for subscriptions
  httpLink,   // HTTP for queries/mutations
);
```

### Optimistic Responses

Show the message before the server confirms:

```typescript
sendMessageMutation({
  variables: { receiverId, content },
  optimisticResponse: {
    __typename: 'Mutation',
    sendMessage: {
      id: `temp-${Date.now()}`,    // temporary ID
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUserId,
      read: false,
    },
  },
  update: (cache, { data }) => {
    // Replace optimistic message with server response
    cache.writeQuery({ query: GET_CONVERSATION, data: { ... } });
  },
});
```

### Cache Updates

When a subscription receives data, it updates the Apollo cache:

```typescript
useSubscription(ON_NEW_MESSAGE, {
  onData: ({ client, data: subData }) => {
    const msg = subData.data.newMessage;
    const cached = client.cache.readQuery({
      query: GET_CONVERSATION,
      variables: { userId: otherUserId, page: 1 },
    });
    if (cached) {
      client.cache.writeQuery({
        query: GET_CONVERSATION,
        variables: { userId: otherUserId, page: 1 },
        data: {
          conversation: {
            ...cached.conversation,
            data: [...cached.conversation.data, msg],
          },
        },
      });
    }
  },
});
```

---

## 6. Key GraphQL Concepts Summary

| Concept | What it is | Example |
|---------|-----------|---------|
| Schema | Defines available data | `type Query { ... }` |
| Query | Read data | `query { conversations { id } }` |
| Mutation | Write data | `mutation { sendMessage(...) { id } }` |
| Subscription | Real-time push | `subscription { newMessage { id } }` |
| Resolver | Backend function that resolves each field | `messages.resolver.ts` |
| ObjectType | A GraphQL type decorator | `@ObjectType() class UserType` |
| Field | A field on a type | `@Field() id: string` |
| PubSub | Publish/subscribe event system | In-memory or Redis |
| Filter | Server-side subscription filtering | Only deliver to sender/receiver |

### When to Use GraphQL vs REST

- **GraphQL** is great when clients need flexible data shapes, or for real-time features (subscriptions)
- **REST** is simpler for CRUD operations, file uploads, and caching at the HTTP level
