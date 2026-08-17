/**
 * Lightweight in-process rate limiter using a Map<key, {count, windowStart}>.
 * Resets on server restart — good for single-node deployment (Cloudflare Workers / Next.js).
 * For multi-node use, replace with a Redis-backed implementation.
 */

interface Window {
  count: number;
  windowStart: number;
}

const store = new Map<string, Window>();

/**
 * @param key      Unique identifier (IP address or userId:endpoint)
 * @param limit    Max requests allowed per window
 * @param windowMs Duration of the window in milliseconds
 * @returns        { allowed: boolean; remaining: number; resetInMs: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  entry.count += 1;
  const resetInMs = windowMs - (now - entry.windowStart);

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetInMs };
  }

  return { allowed: true, remaining: limit - entry.count, resetInMs };
}

// Prune stale entries every 5 minutes to prevent unbounded memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 10 * 60 * 1000) store.delete(key);
    }
  }, 5 * 60 * 1000);
}
