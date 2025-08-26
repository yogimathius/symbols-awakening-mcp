import { Router } from 'express';
import { z } from 'zod';
import type { IDatabase } from '@/database/Database.js';
import { validateRequest } from '../middleware/validation.js';

/**
 * Validation schemas for symbol operations
 */
const CreateSymbolSchema = z.object({
  id: z.string()
    .min(1, 'ID is required')
    .max(100, 'ID must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID must contain only alphanumeric characters, underscores, and hyphens'),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .nullable()
    .optional()
    .transform((val) => val || null),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  interpretations: z.record(z.string())
    .default({}),
  related_symbols: z.array(z.string())
    .default([]),
  properties: z.record(z.unknown())
    .default({}),
});

const UpdateSymbolSchema = CreateSymbolSchema.partial().omit({ id: true });

const QuerySymbolsSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Create symbol routes
 */
export function createSymbolRoutes(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/symbols:
   *   get:
   *     summary: List symbols with optional filtering and pagination
   *     tags: [Symbols]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 1000
   *           default: 50
   *         description: Number of symbols to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of symbols to skip
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search symbols by text query
   *     responses:
   *       200:
   *         description: List of symbols
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Symbol'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/', validateRequest({ query: QuerySymbolsSchema }), async (req, res) => {
    try {
      const query = req.query as unknown as z.infer<typeof QuerySymbolsSchema>;
      const { limit, offset, category, search } = query;

      let result;
      if (search) {
        result = await database.searchSymbols(search, { limit, offset });
      } else if (category) {
        result = await database.filterByCategory(category, { limit, offset });
      } else {
        result = await database.getSymbols({ limit, offset });
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error?.message || 'Failed to retrieve symbols',
        });
      }

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          limit,
          offset,
          count: result.data?.length || 0,
        },
        query: {
          ...(category && { category }),
          ...(search && { search }),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/symbols/{id}:
   *   get:
   *     summary: Get a specific symbol by ID
   *     tags: [Symbols]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Symbol ID
   *     responses:
   *       200:
   *         description: Symbol details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Symbol'
   *       404:
   *         description: Symbol not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Search for the specific symbol
      const result = await database.searchSymbols(id, { limit: 1 });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error?.message || 'Failed to retrieve symbol',
        });
      }

      const symbol = result.data?.find(s => s.id === id);
      if (!symbol) {
        return res.status(404).json({
          success: false,
          error: `Symbol with ID "${id}" not found`,
        });
      }

      res.json({
        success: true,
        data: symbol,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/symbols:
   *   post:
   *     summary: Create a new symbol
   *     tags: [Symbols]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [id, name, description]
   *             properties:
   *               id:
   *                 type: string
   *                 pattern: '^[a-zA-Z0-9_-]+$'
   *                 example: 'new_symbol'
   *               name:
   *                 type: string
   *                 maxLength: 255
   *                 example: 'New Symbol'
   *               category:
   *                 type: string
   *                 maxLength: 100
   *                 example: 'modern'
   *               description:
   *                 type: string
   *                 maxLength: 2000
   *                 example: 'Description of the new symbol'
   *               interpretations:
   *                 type: object
   *                 example: { "meaning": "Example interpretation" }
   *               related_symbols:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["related_symbol_1"]
   *               properties:
   *                 type: object
   *                 example: { "origin": "modern" }
   *     responses:
   *       201:
   *         description: Symbol created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Symbol'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Symbol with ID already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/', validateRequest({ body: CreateSymbolSchema }), async (req, res) => {
    try {
      const symbolData = req.body as z.infer<typeof CreateSymbolSchema>;

      const result = await database.createSymbol(symbolData);

      if (!result.success) {
        const statusCode = result.error?.message.includes('already exists') ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error?.message || 'Failed to create symbol',
        });
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/symbols/{id}:
   *   put:
   *     summary: Update an existing symbol
   *     tags: [Symbols]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Symbol ID to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 255
   *               category:
   *                 type: string
   *                 maxLength: 100
   *               description:
   *                 type: string
   *                 maxLength: 2000
   *               interpretations:
   *                 type: object
   *               related_symbols:
   *                 type: array
   *                 items:
   *                   type: string
   *               properties:
   *                 type: object
   *     responses:
   *       200:
   *         description: Symbol updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Symbol'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Symbol not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put('/:id', validateRequest({ body: UpdateSymbolSchema }), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body as z.infer<typeof UpdateSymbolSchema>;

      const result = await database.updateSymbol(id, updates);

      if (!result.success) {
        const statusCode = result.error?.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error?.message || 'Failed to update symbol',
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/symbols/{id}:
   *   delete:
   *     summary: Delete a symbol
   *     tags: [Symbols]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Symbol ID to delete
   *       - in: query
   *         name: cascade
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Whether to remove references to this symbol from other symbols
   *     responses:
   *       200:
   *         description: Symbol deleted successfully
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
   *                   example: 'Symbol deleted successfully'
   *       404:
   *         description: Symbol not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cascade = req.query.cascade === 'true';

      const result = await database.deleteSymbol(id, cascade);

      if (!result.success) {
        const statusCode = result.error?.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error?.message || 'Failed to delete symbol',
        });
      }

      res.json({
        success: true,
        message: `Symbol "${id}" deleted successfully${cascade ? ' with cascade cleanup' : ''}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/symbols/categories:
   *   get:
   *     summary: Get all available symbol categories
   *     tags: [Symbols]
   *     responses:
   *       200:
   *         description: List of categories
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["mathematical", "spiritual", "ancient"]
   */
  router.get('/meta/categories', async (req, res) => {
    try {
      const result = await database.getCategories();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error?.message || 'Failed to retrieve categories',
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}