import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Create Redis client if URL is provided
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

// Connect Redis if available
if (redisClient) {
  redisClient.connect().catch(console.error);
}

// Base rate limiter configuration
const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  const config: any = {
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  };

  // Use Redis store if available for distributed rate limiting
  if (redisClient) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }

  return rateLimit(config);
};

// Default rate limiter (100 requests per 15 minutes)
export const rateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX || '100')
);

// Strict rate limiter for expensive operations (10 requests per 15 minutes)
export const strictRateLimiter = createRateLimiter(15 * 60 * 1000, 10);

// API key based rate limiter with higher limits
export const apiKeyRateLimiter = createRateLimiter(15 * 60 * 1000, 1000);