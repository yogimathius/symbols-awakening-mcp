import { Router } from 'express';
import { z } from 'zod';
import type { IDatabase } from '@/database/Database.js';
import { validateRequest } from '../middleware/validation.js';

/**
 * Validation schemas for symbol set operations
 */
const CreateSymbolSetSchema = z.object({
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
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  symbols: z.array(z.string())
    .default([]),
});

const UpdateSymbolSetSchema = CreateSymbolSetSchema.partial().omit({ id: true });

const QuerySymbolSetsSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

/**
 * Create symbol set routes
 */
export function createSymbolSetRoutes(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/symbol-sets:
   *   get:
   *     summary: List symbol sets with optional filtering and pagination
   *     tags: [Symbol Sets]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 1000
   *           default: 50
   *         description: Number of symbol sets to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of symbol sets to skip
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search symbol sets by text query
   *     responses:
   *       200:
   *         description: List of symbol sets
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
   *                     $ref: '#/components/schemas/SymbolSet'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     count:
   *                       type: integer
   */
  router.get('/', validateRequest({ query: QuerySymbolSetsSchema }), async (req, res) => {
    try {
      const { limit, offset, search } = req.query as z.infer<typeof QuerySymbolSetsSchema>;

      let result;
      if (search) {
        result = await database.searchSymbolSets(search, { limit, offset });
      } else {
        result = await database.getSymbolSets({ limit, offset });
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error?.message || 'Failed to retrieve symbol sets',
        });
      }

      res.json({
        success: true,
        data: result.data,
        pagination: {
          limit,
          offset,
          count: result.data?.length || 0,
        },
        query: {
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
   * /api/symbol-sets/{id}:
   *   get:
   *     summary: Get a specific symbol set by ID
   *     tags: [Symbol Sets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Symbol set ID
   *     responses:
   *       200:
   *         description: Symbol set details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SymbolSet'
   *       404:
   *         description: Symbol set not found
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Search for the specific symbol set
      const result = await database.searchSymbolSets(id, { limit: 1 });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error?.message || 'Failed to retrieve symbol set',
        });
      }

      const symbolSet = result.data?.find(s => s.id === id);
      if (!symbolSet) {
        return res.status(404).json({
          success: false,
          error: `Symbol set with ID "${id}" not found`,
        });
      }

      res.json({
        success: true,
        data: symbolSet,
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
   * /api/symbol-sets:
   *   post:
   *     summary: Create a new symbol set
   *     tags: [Symbol Sets]
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
   *                 example: 'wisdom_collection'
   *               name:
   *                 type: string
   *                 maxLength: 255
   *                 example: 'Wisdom Collection'
   *               category:
   *                 type: string
   *                 maxLength: 100
   *                 example: 'wisdom'
   *               description:
   *                 type: string
   *                 maxLength: 2000
   *                 example: 'A collection of symbols representing wisdom'
   *               symbols:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["infinity_symbol", "tree_of_life"]
   *     responses:
   *       201:
   *         description: Symbol set created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SymbolSet'
   *       400:
   *         description: Invalid input data
   *       409:
   *         description: Symbol set with ID already exists
   */
  router.post('/', validateRequest({ body: CreateSymbolSetSchema }), async (req, res) => {
    try {
      const symbolSetData = req.body as z.infer<typeof CreateSymbolSetSchema>;

      const result = await database.createSymbolSet(symbolSetData);

      if (!result.success) {
        const statusCode = result.error?.message.includes('already exists') ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error?.message || 'Failed to create symbol set',
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
   * /api/symbol-sets/{id}:
   *   put:
   *     summary: Update an existing symbol set
   *     tags: [Symbol Sets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Symbol set ID to update
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
   *               symbols:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Symbol set updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SymbolSet'
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Symbol set not found
   */
  router.put('/:id', validateRequest({ body: UpdateSymbolSetSchema }), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body as z.infer<typeof UpdateSymbolSetSchema>;

      const result = await database.updateSymbolSet(id, updates);

      if (!result.success) {
        const statusCode = result.error?.message.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error?.message || 'Failed to update symbol set',
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

  return router;
}