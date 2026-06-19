import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // For GraphQL contexts, skip throttling (req.ip is not available)
    // GraphQL rate limiting is handled separately via depth/complexity guards
    const gqlCtx = GqlExecutionContext.create(context);
    if (gqlCtx.getType() === 'graphql') {
      return true;
    }

    return super.canActivate(context);
  }
}
