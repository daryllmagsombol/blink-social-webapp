import type { ApolloServerPlugin } from '@apollo/server';

/**
 * Apollo Server plugin that applies rate limiting per-operation.
 *
 * Subscriptions get a stricter limit since they are long-lived.
 * Mutations get a moderate limit to prevent spam.
 * Queries get a generous limit.
 */
export function operationRateLimitPlugin(): ApolloServerPlugin {
  // In-memory counters — reset on server restart (acceptable for now)
  const counters = new Map<string, { count: number; resetAt: number }>();

  const LIMITS: Record<string, { max: number; windowMs: number }> = {
    subscription: { max: 10, windowMs: 60_000 },     // 10 connections/min
    mutation: { max: 30, windowMs: 60_000 },          // 30 mutations/min
    query: { max: 300, windowMs: 60_000 },            // 300 queries/min
  };

  return {
    async requestDidStart(ctx) {
      const operationName =
        ctx.request.operationName ||
        (ctx.request.query?.startsWith('subscription')
          ? 'subscription'
          : ctx.request.query?.startsWith('mutation')
            ? 'mutation'
            : 'query');

      const limits = LIMITS[operationName] ?? LIMITS.query;
      const key = `${operationName}:${ctx.request.http?.headers.get('x-forwarded-for') || 'anon'}`;

      const entry = counters.get(key);
      const now = Date.now();

      if (!entry || now > entry.resetAt) {
        counters.set(key, { count: 1, resetAt: now + limits.windowMs });
        return;
      }

      entry.count++;

      if (entry.count > limits.max) {
        throw new Error(
          `Rate limit exceeded for ${operationName}. Limit: ${limits.max} per ${limits.windowMs / 1000}s`,
        );
      }
    },
  };
}
