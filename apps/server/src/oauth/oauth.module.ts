import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [OAuthController],
  providers: [GoogleStrategy, GithubStrategy],
})
export class OAuthModule {}
