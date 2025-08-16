// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import { z } from 'zod';

import { alkaneProxyRouter } from './routes/alkanes.js';
import { dieselRouter } from './routes/diesel.js';
import { wsHandler } from './services/websocket.js';
import syncCheckRouter from './routes/sync-check.js';
import { cacheMiddleware } from './middleware/cache.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware } from './middleware/metrics.js';

// Configure logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined
});

// Environment configuration schema
const envSchema = z.object({
  PORT: z.string().default('3001'),
  ALKANES_RPC_URL: z.string().default('http://alkanes.andr0x.com:18332'),
  ALKANES_RPC_USER: z.string().optional(),
  ALKANES_RPC_PASSWORD: z.string().optional(),
  SANDSHREW_API_KEY: z.string().optional(),
  SANDSHREW_NETWORK: z.string().default('mainnet'),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW: z.string().default('15'),
  RATE_LIMIT_MAX: z.string().default('100'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CACHE_TTL: z.string().default('60'),
  ENABLE_WEBSOCKET: z.string().default('true'),
  API_KEY: z.string().optional(),
  VERCEL: z.string().optional(),
});

// Validate environment
const env = envSchema.parse(process.env);

// Create Express app
const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and metrics
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes with rate limiting and caching
app.use('/api/alkanes', rateLimiter, cacheMiddleware, alkaneProxyRouter);
app.use('/api/diesel', rateLimiter, cacheMiddleware, dieselRouter);
app.use('/api/sync', syncCheckRouter);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'DIESEL Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      alkanes: {
        blockchain_info: '/api/alkanes/blockchain-info',
        protorunes_by_height: '/api/alkanes/protorunes/:height',
        protorunes_by_address: '/api/alkanes/address/:address',
        current_participation: '/api/alkanes/participation/current',
        participation_trends: '/api/alkanes/participation/trends'
      },
      diesel: {
        current_stats: '/api/diesel/stats',
        distribution: '/api/diesel/distribution',
        tvl: '/api/diesel/tvl',
        alerts: '/api/diesel/alerts',
        mint_history: '/api/diesel/mint-history/:address'
      },
      websocket: env.ENABLE_WEBSOCKET === 'true' ? '/ws' : null
    },
    documentation: 'https://github.com/dynamous-community/diesel-dashboard',
    rateLimit: {
      window: `${env.RATE_LIMIT_WINDOW} minutes`,
      maxRequests: env.RATE_LIMIT_MAX
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// WebSocket server setup
if (env.ENABLE_WEBSOCKET === 'true' && !env.VERCEL) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wsHandler(wss, logger);
  logger.info('WebSocket server initialized at /ws');
}

// Start server (skip if running on Vercel)
if (!env.VERCEL) {
  const port = parseInt(env.PORT, 10);
  server.listen(port, () => {
    logger.info(`🚀 DIESEL API server running on port ${port}`);
    logger.info(`📊 Environment: ${env.NODE_ENV}`);
    logger.info(`🔗 Alkanes RPC: ${env.ALKANES_RPC_URL}`);
    logger.info(`🔄 WebSocket: ${env.ENABLE_WEBSOCKET === 'true' ? 'Enabled' : 'Disabled'}`);
    logger.info(`💾 Redis Cache: ${env.REDIS_URL ? 'Connected' : 'Memory Cache'}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;