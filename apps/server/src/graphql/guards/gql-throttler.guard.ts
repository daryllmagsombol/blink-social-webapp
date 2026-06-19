import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);

    // For GraphQL, extract the Express request from context so the base
    // ThrottlerGuard can read req.ip for rate-limit tracking
    if (gqlCtx.getType() === 'graphql') {
      // Build a synthetic HTTP context wrapping the Express req
      const ctx = gqlCtx.getContext();
      const expressReq = ctx?.req;

      if (expressReq) {
        // Provide a getRequest/getResponse that returns the real Express objects
        const syntheticContext = {
          ...context,
          getType: () => 'http',
          switchToHttp: () => ({
            getRequest: <T = any>() => expressReq as T,
            getResponse: <T = any>() => (expressReq.res ?? {}) as T,
            getNext: () => ({}),
          }),
        } as ExecutionContext;

        return super.canActivate(syntheticContext);
      }
    }

    return super.canActivate(context);
  }
}
