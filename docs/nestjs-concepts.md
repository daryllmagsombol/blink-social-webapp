# NestJS Concepts

NestJS is a backend framework for Node.js built on top of Express (or Fastify). It brings **modular architecture**, **dependency injection**, and **decorators** to Node.js — concepts from frameworks like Spring Boot (Java) or Angular (TypeScript).

---

## 1. Core Building Blocks

### Modules (`@Module`)

The fundamental organizing unit. Every feature gets its own module.

```typescript
// apps/server/src/posts/posts.module.ts
@Module({
  controllers: [PostsController],  // routes
  providers: [PostsService],       // injectable services
  exports: [PostsService],         // make available to other modules
})
export class PostsModule {}
```

Modules are imported into `AppModule` to wire them together. A module can also import other modules to use their exported providers.

### Controllers (`@Controller`)

Handle incoming HTTP requests and return responses. They contain route handlers.

```typescript
@Controller('auth')       // base path: /api/auth (global prefix adds /api)
export class AuthController {
  constructor(private auth: AuthService) {}  // DI — NestJS injects AuthService

  @Post('register')       // POST /api/auth/register
  register(@Body() dto: RegisterDto) { ... }

  @UseGuards(JwtAuthGuard)
  @Get('me')              // GET /api/auth/me
  me(@CurrentUser() user: any) { ... }
}
```

**Key decorators for controllers:**
| Decorator | What it does |
|-----------|-------------|
| `@Body()` | Extract request body |
| `@Param('id')` | Extract route param |
| `@Query('page')` | Extract query string |
| `@Headers()` | Extract headers |
| `@Req()` | Full Express request object |

### Providers / Services (`@Injectable`)

Business logic classes that can be injected into controllers or other services.

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,  // PrismaClient injected
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException();
    return { tokens: await this.generateTokens(user.id, user.email) };
  }
}
```

---

## 2. Dependency Injection (DI)

The core idea: instead of manually creating dependencies (`new AuthService(new PrismaService())`), you **declare what you need** in the constructor, and NestJS provides it.

```typescript
// Without DI (manual):
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// With DI (NestJS):
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}  // NestJS provides it
}
```

**How DI works in this project:**
1. `PrismaModule` is `@Global()` — makes `PrismaService` available everywhere
2. Any module that needs `PrismaService` just declares it in the constructor
3. NestJS creates one singleton instance and shares it across all consumers
4. `PostsModule` imports nothing (it only needs `PrismaService` which is global)
5. `MessagesModule` might export `MessagesService` so `GraphqlModule` can use it

---

## 3. Guards

Guards are middleware that determine if a request should proceed. They run before the route handler.

```typescript
// apps/server/src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Applied with `@UseGuards(JwtAuthGuard)` on controllers or individual routes.

**In this project there are two patterns:**
- `@UseGuards(JwtAuthGuard)` — blocks unauthenticated requests
- `@UseGuards(OptionalJwtAuthGuard)` — allows requests without token but still provides user context if token exists (used for public profiles, posts that might be private)

```typescript
@Get('posts/:id')
@UseGuards(OptionalJwtAuthGuard)
findById(@Param('id') id: string, @CurrentUser('id') viewerId?: string) {
  // viewerId is undefined if no token, string if authenticated
  return this.posts.findById(id, viewerId);
}
```

---

## 4. Pipes — Validation & Transformation

Pipes process input data before it reaches the handler. `ValidationPipe` with `class-validator` DTOs:

```typescript
// apps/server/src/auth/dto/register.dto.ts
export class RegisterDto {
  @IsString()
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

Applied globally in `main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // strips unknown properties
    forbidNonWhitelisted: true,   // throws error on unknown properties
    transform: true,              // auto-transform types (string "1" → number 1)
  }),
);
```

---

## 5. Decorators — Custom Parameter Decorators

NestJS lets you create reusable parameter decorators:

```typescript
// apps/server/src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
```

Usage: `@CurrentUser()` returns the full user, `@CurrentUser('id')` returns just the ID.

---

## 6. Module Pattern in This Project

Each feature follows the same structure:

```
src/feature/
├── dto/               # Data Transfer Objects (validation schemas)
│   ├── create-*.ts
│   └── update-*.ts
├── feature.module.ts  # Module definition
├── feature.controller.ts  # HTTP routes
├── feature.service.ts     # Business logic
└── whatever.guard.ts # Feature-specific guards
```

**To create a new feature, you:**
1. Create `x.module.ts` with `@Module()` decorator
2. Create `x.service.ts` with `@Injectable()`
3. Create `x.controller.ts` with route handlers
4. Add `XModule` to imports in `AppModule`

---

## 7. Lifecycle Hooks

Services can implement lifecycle interfaces:

```typescript
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

---

## 8. Global Configuration

**app.module.ts** wires everything together:
- `ConfigModule.forRoot({ isGlobal: true })` — loads `.env` file
- `ThrottlerModule.forRoot([...])` — rate limiting
- `ServeStaticModule.forRoot(...)` — serves uploaded images at `/uploads/*`
- All feature modules imported
- `APP_GUARD` provider — globally applies the rate-limit guard

**main.ts** sets up global settings:
- CORS (calls from frontend on port 3000)
- Helmet (security headers)
- express-session (for OAuth state parameter)
- Global prefix `/api`
- Validation pipe
- Shutdown hooks

---

## 9. How It Compares to Express

| Express | NestJS |
|---------|--------|
| `app.get('/users', handler)` | `@Get('users')` in a controller class |
| `app.use(middleware)` | Guards, Interceptors, Pipes, Middleware |
| `const db = new PrismaClient()` | Inject `PrismaService` via constructor |
| `router.get('/posts', auth, handler)` | `@UseGuards(JwtAuthGuard)` decorator |
| Manual module splitting | `@Module()` with imports/exports |
| `app.listen(4000)` | Same, but `NestFactory.create(AppModule)` |

The **biggest mental shift**: instead of writing route functions, you write classes with decorators. NestJS handles instantiation and wiring through DI.
