import { Request, Response, NextFunction } from 'express';

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

// Store metrics in memory (could be extended to use Prometheus/DataDog)
const metricsStore: RequestMetrics[] = [];
const MAX_METRICS = 10000;

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Add response time header before sending response
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    return originalSend.call(this, data);
  };

  // Capture response finish event for metrics
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    const metric: RequestMetrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
    };

    // Store metric
    metricsStore.push(metric);

    // Prevent memory overflow
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.shift();
    }
  });

  next();
};

// Endpoint to retrieve metrics
export const getMetrics = () => {
  const now = Date.now();
  const last5Minutes = now - 5 * 60 * 1000;
  
  const recentMetrics = metricsStore.filter(
    m => m.timestamp.getTime() > last5Minutes
  );

  const avgResponseTime = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    : 0;

  const statusCodes = recentMetrics.reduce((acc, m) => {
    acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    totalRequests: recentMetrics.length,
    avgResponseTime: Math.round(avgResponseTime),
    statusCodes,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
};