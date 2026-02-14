const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * Returns { success: true } if under the limit, { success: false } if exceeded.
 */
export function rateLimit(
  key: string,
  { maxRequests = 3, windowMs = 60 * 60 * 1000 }: { maxRequests?: number; windowMs?: number } = {}
): { success: boolean } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= maxRequests) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}
