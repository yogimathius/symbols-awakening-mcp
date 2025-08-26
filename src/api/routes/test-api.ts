import { Router } from 'express';
import type { IDatabase } from '@/database/Database.js';

/**
 * Create basic test routes to verify API server functionality
 */
export function createTestRoutes(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/test:
   *   get:
   *     summary: Test endpoint to verify API is working
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: API is working
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 'API is working correctly'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get('/test', (_req, res) => {
    return res.json({
      success: true,
      message: 'REST API is working correctly',
      timestamp: new Date().toISOString(),
      database: database ? 'connected' : 'not connected',
    });
  });

  return router;
}