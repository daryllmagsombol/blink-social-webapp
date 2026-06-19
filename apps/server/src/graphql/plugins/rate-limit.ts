import { GraphQLError } from 'graphql';
import type { ApolloServerPlugin } from '@apollo/server';

const MAX_CACHE_ENTRIES = 10_000;

/**
 * Apollo Server plugin that applies per-operation-type rate limiting.
 *
 * Limits (per client key, per window):
 *   subscriptions: 10/min  (long-lived connections)
 *   mutations:     30/min  (prevent spam)
 *   queries:      300/min  (generous for normal usage)
 *
 * In-memory counters with periodic cleanup to bound memory usage.
 */
export function operationRateLimitPlugin(): ApolloServerPlugin {
  const counters = new Map<string, { count: number; resetAt: number }>();

  const LIMITS: Record<string, { max: number; windowMs: number }> = {
    subscription: { max: 10, windowMs: 60_000 },
    mutation: { max: 30, windowMs: 60_000 },
    query: { max: 300, windowMs: 60_000 },
  };

  return {
    async requestDidStart(ctx) {
      // Classify operation type from the query string
      const q = ctx.request.query ?? '';
      const operationType = q.startsWith('subscription')
        ? 'subscription'
        : q.startsWith('mutation')
          ? 'mutation'
          : 'query';

      const limits = LIMITS[operationType] ?? LIMITS.query;
      const clientKey =
        (ctx.request.http?.headers.get('x-forwarded-for') as string) ||
        (ctx.request.http?.headers.get('x-real-ip') as string) ||
        'anon';

      const key = `${operationType}:${clientKey}`;
      const now = Date.now();

      const entry = counters.get(key);

      // Evict stale entries and enforce cache size limit
      if (!entry || now > entry.resetAt) {
        counters.set(key, { count: 1, resetAt: now + limits.windowMs });
        // Periodic cleanup: remove expired entries and cap total size
        if (counters.size > MAX_CACHE_ENTRIES) {
          for (const [k, v] of counters) {
            if (now > v.resetAt) counters.delete(k);
          }
        }
        return;
      }

      entry.count++;

      if (entry.count > limits.max) {
        throw new GraphQLError(
          `Rate limit exceeded for ${operationType}. Limit: ${limits.max} per ${limits.windowMs / 1000}s`,
          {
            extensions: { code: 'RATE_LIMITED' },
          },
        );
      }
    },
  };
}
