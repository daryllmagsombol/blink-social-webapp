import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: join(cwd(), '.env') }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    // Keep uploads on a configurable path so the VM can mount a persistent volume.
    ServeStaticModule.forRoot({
      rootPath: resolve(cwd(), process.env.UPLOADS_DIR ?? 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
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
})
export class AppModule {}
