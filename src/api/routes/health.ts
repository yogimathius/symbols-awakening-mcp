import { Router } from 'express';
import type { IDatabase } from '@/database/Database.js';

/**
 * Create health check routes
 */
export function createHealthRoutes(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 status:
   *                   type: string
   *                   example: 'healthy'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: '2024-01-01T00:00:00.000Z'
   *                 services:
   *                   type: object
   *                   properties:
   *                     api:
   *                       type: string
   *                       example: 'healthy'
   *                     database:
   *                       type: string
   *                       example: 'healthy'
   *                     mcp:
   *                       type: string
   *                       example: 'available'
   *                 version:
   *                   type: string
   *                   example: '1.0.0'
   *       503:
   *         description: Service is unhealthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 status:
   *                   type: string
   *                   example: 'unhealthy'
   *                 error:
   *                   type: string
   *                   example: 'Database connection failed'
   */
  router.get('/health', async (_req, res) => {
    try {
      const startTime = Date.now();
      
      // Check database health
      const dbHealth = await database.healthCheck();
      const responseTime = Date.now() - startTime;

      if (!dbHealth.success) {
        return res.status(503).json({
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: dbHealth.error?.message || 'Database health check failed',
          services: {
            api: 'healthy',
            database: 'unhealthy',
            mcp: 'available',
          },
          metrics: {
            responseTime,
            uptime: process.uptime(),
          },
        });
      }

      return res.json({
        success: true,
        status: 'healthy',
        timestamp: dbHealth.data?.timestamp.toISOString() || new Date().toISOString(),
        services: {
          api: 'healthy',
          database: 'healthy',
          mcp: 'available',
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        metrics: {
          responseTime,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown health check error',
        services: {
          api: 'degraded',
          database: 'unknown',
          mcp: 'available',
        },
      });
    }
  });

  /**
   * @swagger
   * /api/ready:
   *   get:
   *     summary: Readiness check endpoint
   *     tags: [Health]
   *     description: Check if the service is ready to accept requests
   *     responses:
   *       200:
   *         description: Service is ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 ready:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       503:
   *         description: Service is not ready
   */
  router.get('/ready', async (_req, res) => {
    try {
      // Check if database connection is working
      const dbHealth = await database.healthCheck();
      
      const isReady = dbHealth.success;
      const statusCode = isReady ? 200 : 503;

      return res.status(statusCode).json({
        success: isReady,
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth.success,
        },
        ...(dbHealth.error && { error: dbHealth.error.message }),
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown readiness check error',
        checks: {
          database: false,
        },
      });
    }
  });

  /**
   * @swagger
   * /api/live:
   *   get:
   *     summary: Liveness check endpoint
   *     tags: [Health]
   *     description: Check if the service is alive (basic health check without dependencies)
   *     responses:
   *       200:
   *         description: Service is alive
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 alive:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: number
   *                   example: 3600
   */
  router.get('/live', (_req, res) => {
    return res.json({
      success: true,
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  return router;
}