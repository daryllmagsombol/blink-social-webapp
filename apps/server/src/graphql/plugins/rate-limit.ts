import { GraphQLError } from 'graphql';
import type { ApolloServerPlugin } from '@apollo/server';

const MAX_CACHE_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 120_000; // 2 minutes

/**
 * Apollo Server plugin that applies per-operation-type rate limiting.
 *
 * Limits (per client IP, per window):
 *   subscription: 10/min  (long-lived connections)
 *   mutation:     30/min  (prevent spam)
 *   query:       300/min  (generous for normal usage)
 *
 * Uses parsed operation kind from didResolveOperation (not raw query string)
 * to avoid bypass via comments or misleading operation names.
 * Client identity is derived from Express req.ip (TCP remote address),
 * not from client-settable headers.
 */
export function operationRateLimitPlugin(): ApolloServerPlugin {
  const counters = new Map<string, { count: number; resetAt: number }>();

  const LIMITS: Record<string, { max: number; windowMs: number }> = {
    subscription: { max: 10, windowMs: 60_000 },
    mutation: { max: 30, windowMs: 60_000 },
    query: { max: 300, windowMs: 60_000 },
  };

  // Periodic cleanup of expired entries to bound memory
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of counters) {
      if (now > entry.resetAt) counters.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the timer to not block process exit
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }

  return {
    async requestDidStart(ctx) {
      // Extract client IP from the Express request (trusted TCP address)
      const expressReq = (ctx as any).request?.http?.req;
      const clientIp =
        expressReq?.ip ||
        expressReq?.socket?.remoteAddress ||
        expressReq?.connection?.remoteAddress ||
        'anon';

      return {
        async didResolveOperation(resolveCtx: any) {
          // Use the parsed operation type — can't be bypassed by comments or names
          const kind = resolveCtx.operation?.operation ?? 'query';
          const operationType = kind === 'mutation' ? 'mutation'
            : kind === 'subscription' ? 'subscription'
            : 'query';

          const limits = LIMITS[operationType] ?? LIMITS.query;
          const key = `${operationType}:${clientIp}`;
          const now = Date.now();

          const entry = counters.get(key);

          if (!entry || now > entry.resetAt) {
            counters.set(key, { count: 1, resetAt: now + limits.windowMs });
            // Cap cache size to prevent memory leaks
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
              { extensions: { code: 'RATE_LIMITED' } },
            );
          }
        },
      };
    },
  };
}
