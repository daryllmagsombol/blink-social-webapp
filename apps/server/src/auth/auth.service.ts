import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    const password = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password,
        displayName: dto.displayName,
      },
      select: { id: true, username: true, email: true, displayName: true, avatarUrl: true },
    });

    return {
      user,
      tokens: await this.generateTokens(user.id, user.email),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      tokens: await this.generateTokens(user.id, user.email),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });

      if (!user) throw new UnauthorizedException();

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload as any, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') || '15m') as any,
      }),
      this.jwt.signAsync(payload as any, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
