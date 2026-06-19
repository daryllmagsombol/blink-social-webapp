import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * ThrottlerGuard wrapper that handles both HTTP (REST) and GraphQL contexts.
 *
 * For GraphQL, skip the standard Express-based rate limiter. The base
 * ThrottlerGuard relies on Express request objects (req.ip, getHandler, etc.)
 * that aren't directly available in GraphQL execution contexts. Apollo Server
 * provides its own rate-limiting via query complexity/depth analysis, which
 * should be configured separately.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    if (gqlCtx.getType() === 'graphql') {
      return true;
    }
    return super.canActivate(context);
  }
}
