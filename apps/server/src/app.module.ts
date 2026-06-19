import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './graphql/guards/gql-throttler.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve, join } from 'path';
import { cwd } from 'process';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
import { StoriesModule } from './stories/stories.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { UploadsModule } from './uploads/uploads.module';
import { SearchModule } from './search/search.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BlocksModule } from './blocks/blocks.module';
import { ReportsModule } from './reports/reports.module';
import { OAuthModule } from './oauth/oauth.module';
import { GraphqlModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: join(cwd(), '.env') }),
    ThrottlerModule.forRoot([{
      name: 'short',  // default — applied globally
      ttl: 60000,
      limit: 120,
    }]),
    // Keep uploads on a configurable path so the VM can mount a persistent volume.
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOADS_DIR
        ? resolve(process.env.UPLOADS_DIR)
        : resolve(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    GraphqlModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    FollowsModule,
    StoriesModule,
    MessagesModule,
    NotificationsModule,
    ChatModule,
    UploadsModule,
    SearchModule,
    BookmarksModule,
    BlocksModule,
    ReportsModule,
    OAuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
  ],
})
export class AppModule {}
