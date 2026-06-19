import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * ThrottlerGuard wrapper that handles both HTTP (REST) and GraphQL contexts.
 *
 * For GraphQL, the standard Express-based ThrottlerGuard is incompatible
 * (relies on Express request objects via getHandler/switchToHttp which don't
 * exist in GQL execution contexts). GraphQL rate limiting is handled by
 * Apollo Server plugins configured in graphql.module.ts:
 *   - depthLimitRule(6)          — max query nesting depth
 *   - operationRateLimitPlugin() — per-operation-type rate limits
 *
 * REST endpoints continue to use the full ThrottlerGuard pipeline.
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
