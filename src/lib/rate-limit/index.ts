/**
 * Rate Limiting Utility
 *
 * Implements token bucket algorithm for API rate limiting
 * Prevents abuse and ensures fair resource usage
 *
 * Usage:
 * ```typescript
 * import { createRateLimiter } from '@/lib/rate-limit';
 *
 * const limiter = createRateLimiter({
 *   maxRequests: 10,
 *   windowMs: 60000, // 1 minute
 * });
 *
 * const allowed = limiter.check(userId);
 * if (!allowed) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
 */

// ============================================
// In-Memory Rate Limiter
// ============================================

interface RateLimiterConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional: Cleanup interval for old entries (default: 5 minutes) */
  cleanupMs?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * In-memory rate limiter using token bucket algorithm
 * Suitable for single-instance deployments
 * For distributed systems, use Redis-based implementation
 */
class InMemoryRateLimiter {
  private store: Map<string, TokenBucket> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private cleanupMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.cleanupMs = config.cleanupMs ?? 5 * 60 * 1000; // 5 minutes default

    // Start cleanup interval in production
    if (process.env.NODE_ENV === 'production') {
      this.startCleanup();
    }
  }

  /**
   * Check if request is allowed for the given key
   * Returns true if within rate limit, false otherwise
   *
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns Whether the request is allowed
   */
  check(key: string): boolean {
    const now = Date.now();
    let bucket = this.store.get(key);

    // Create new bucket if not exists
    if (!bucket) {
      bucket = {
        tokens: this.maxRequests - 1,
        lastRefill: now,
      };
      this.store.set(key, bucket);
      return true;
    }

    // Calculate tokens to refill based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const refillRate = this.maxRequests / this.windowMs;
    const tokensToAdd = timePassed * refillRate;

    // Refill bucket
    bucket.tokens = Math.min(
      this.maxRequests,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;

    // Check if token available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Reset rate limit for a specific key
   * Useful for testing or manual reset
   *
   * @param key - Key to reset
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limits
   * Use with caution
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Start cleanup interval to remove stale entries
   * Prevents memory leaks in long-running processes
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = now - (this.windowMs * 2);

      for (const [key, bucket] of this.store.entries()) {
        if (bucket.lastRefill < staleThreshold) {
          this.store.delete(key);
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `[rate-limit] Cleanup: ${this.store.size} active rate limiters`
        );
      }
    }, this.cleanupMs);
  }

  /**
   * Stop cleanup interval
   * Should be called during graceful shutdown
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current stats for a key (useful for logging/debugging)
   *
   * @param key - Key to check
   * @returns Current bucket state or null if not found
   */
  getStats(key: string): { tokens: number; lastRefill: number } | null {
    return this.store.get(key) ?? null;
  }
}

// ============================================
// Rate Limiter Factory
// ============================================

// Global rate limiter instances
const limiters = new Map<string, InMemoryRateLimiter>();

/**
 * Create or get a rate limiter instance
 * Reuses existing instances with same config
 *
 * @param config - Rate limiter configuration
 * @param name - Optional name for the limiter (for tracking)
 * @returns Rate limiter instance
 */
export function createRateLimiter(
  config: RateLimiterConfig,
  name: string = 'default'
): InMemoryRateLimiter {
  const key = `${name}:${config.maxRequests}:${config.windowMs}`;

  if (!limiters.has(key)) {
    limiters.set(key, new InMemoryRateLimiter(config));
  }

  return limiters.get(key)!;
}

// ============================================
// Common Rate Limiters
// ============================================

/**
 * Rate limiter for chat API
 * 10 requests per minute per user
 */
export const chatRateLimiter = createRateLimiter(
  {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  'chat'
);

/**
 * Rate limiter for auth endpoints
 * 5 requests per minute per IP (login attempts)
 */
export const authRateLimiter = createRateLimiter(
  {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  'auth'
);

/**
 * Rate limiter for image uploads
 * 5 uploads per minute per user
 */
export const imageRateLimiter = createRateLimiter(
  {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  'images'
);

// ============================================
// Middleware Helpers
// ============================================

/**
 * Check rate limit and return error response if exceeded
 * Convenience function for API routes
 *
 * @param limiter - Rate limiter instance
 * @param key - Unique identifier (user ID, IP, etc.)
 * @param retryAfterSeconds - Seconds until next allowed request (optional)
 * @returns Response object if rate limited, null if allowed
 */
export function checkRateLimit(
  limiter: InMemoryRateLimiter,
  key: string,
  retryAfterSeconds?: number
) {
  const allowed = limiter.check(key);

  if (!allowed) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NextResponse } = require('next/server');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-RateLimit-Reset': new Date(
        Date.now() + (retryAfterSeconds || 60) * 1000
      ).toISOString(),
    };

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: retryAfterSeconds || 60,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

// ============================================
// Cleanup on Process Termination
// ============================================

/**
 * Gracefully stop all rate limiters
 * Call during app shutdown
 */
export function stopRateLimiters(): void {
  for (const limiter of limiters.values()) {
    limiter.stopCleanup();
  }
  limiters.clear();

  if (process.env.NODE_ENV === 'development') {
    console.debug('[rate-limit] All limiters stopped');
  }
}

// Declare the custom property on the global object
declare global {
  var rateLimitersStopped: boolean;
}

// Auto-cleanup on module unload (if applicable)
if (typeof global !== 'undefined') {
  if (!global.rateLimitersStopped) {
    process.on('SIGTERM', stopRateLimiters);
    process.on('SIGINT', stopRateLimiters);
    global.rateLimitersStopped = true;
  }
}
