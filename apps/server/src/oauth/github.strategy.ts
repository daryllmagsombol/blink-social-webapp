import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const backendUrl = (config.get<string>('BACKEND_URL') || config.getOrThrow<string>('APP_URL')).replace(/\/$/, '');

    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${backendUrl}/api/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error?: any, user?: any) => void,
  ) {
    const email = profile.emails?.[0]?.value || profile.username;
    if (!email) return done(new Error('No email from GitHub'), undefined);

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username: (profile.username || email.split('@')[0]) + '_' + profile.id.slice(-6),
          email,
          password: '',
          displayName: profile.displayName || profile.username || email.split('@')[0],
          emailVerified: true,
        },
      });
    }

    done(null, user);
  }
}
