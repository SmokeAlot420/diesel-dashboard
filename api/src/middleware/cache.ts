import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import crypto from 'crypto';

// Redis client for caching
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redisClient) {
  redisClient.connect().catch(console.error);
}

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

// Cache key generator
const generateCacheKey = (req: Request): string => {
  const hash = crypto.createHash('sha256');
  hash.update(req.method);
  hash.update(req.originalUrl);
  hash.update(JSON.stringify(req.query));
  hash.update(JSON.stringify(req.body || {}));
  return `cache:${hash.digest('hex')}`;
};

// Cache middleware
export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  const ttl = parseInt(process.env.CACHE_TTL || '60'); // seconds

  try {
    // Try Redis cache first
    if (redisClient && redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttl.toString());
        return res.json(data);
      }
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        res.setHeader('X-Cache', 'HIT-MEMORY');
        res.setHeader('X-Cache-TTL', ttl.toString());
        return res.json(cached.data);
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  // Cache MISS - continue to handler
  res.setHeader('X-Cache', 'MISS');

  // Store original send function
  const originalSend = res.json.bind(res);

  // Override json send to cache the response
  res.json = function (data: any) {
    // Cache the successful response
    if (res.statusCode === 200) {
      const cacheData = JSON.stringify(data);
      
      // Store in Redis if available
      if (redisClient && redisClient.isReady) {
        redisClient.setEx(cacheKey, ttl, cacheData).catch(console.error);
      } else {
        // Store in memory cache
        memoryCache.set(cacheKey, {
          data,
          expires: Date.now() + ttl * 1000,
        });

        // Clean up expired entries periodically
        if (memoryCache.size > 1000) {
          const now = Date.now();
          for (const [key, value] of memoryCache.entries()) {
            if (value.expires < now) {
              memoryCache.delete(key);
            }
          }
        }
      }
    }

    return originalSend(data);
  };

  next();
};

// Cache invalidation helper
export const invalidateCache = async (pattern: string) => {
  if (redisClient && redisClient.isReady) {
    const keys = await redisClient.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } else {
    // Clear memory cache entries matching pattern
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  }
};