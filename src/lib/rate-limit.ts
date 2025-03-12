import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
}

// Create Redis instance
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiters for different endpoints
export const notificationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  prefix: 'ratelimit:notification',
});

export const bulkNotificationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 bulk sends per hour
  prefix: 'ratelimit:bulk-notification',
});

export const teamInviteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 team invites per hour
  prefix: 'ratelimit:team-invite',
});

export const sseConnectionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 SSE connection attempts per minute
  prefix: 'ratelimit:sse-connection',
});

// Helper function to check rate limit and return standardized response
export async function checkRateLimit(identifier: string, limiter: Ratelimit) {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);
    return {
      success,
      limit,
      reset,
      remaining,
      error: success ? null : 'Rate limit exceeded'
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Default to allowing the request if rate limiting fails
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      error: 'Rate limit check failed'
    };
  }
}