import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    // Try Authorization header first (HTTP queries/mutations)
    const authHeader = req?.headers?.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const payload = await this.jwt.verifyAsync(token, {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        });
        req.user = { id: payload.sub, ...payload };
        return true;
      } catch {
        // Fall through to try other methods
      }
    }

    // Try connection context (for subscriptions that set req in onConnect)
    if (req?.user) {
      return true;
    }

    return false;
  }
}
