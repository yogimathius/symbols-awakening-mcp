import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import type { IDatabase } from '@/database/Database.js';
import { createTestRoutes } from './routes/test-api.js';
// import { createSymbolRoutes } from './routes/symbols.js';
// import { createSymbolSetRoutes } from './routes/symbol-sets.js';
import { createHealthRoutes } from './routes/health.js';

/**
 * REST API Server for Symbols Awakening
 * Provides HTTP endpoints for all MCP server functionality
 */
export class ApiServer {
  private app: express.Application;
  private server?: import('http').Server;

  constructor(private database: IDatabase) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSwagger();
    this.setupErrorHandling();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true,
    }));

    // Request logging
    this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout
    this.app.use((_req, res, next) => {
      res.setTimeout(30000); // 30 seconds
      next();
    });
  }

  /**
   * Set up API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.use('/api', createHealthRoutes(this.database));

    // Test routes
    this.app.use('/api', createTestRoutes(this.database));

    // TODO: Enable after fixing TypeScript issues
    // Symbol management routes
    // this.app.use('/api/symbols', createSymbolRoutes(this.database));

    // Symbol set routes
    // this.app.use('/api/symbol-sets', createSymbolSetRoutes(this.database));

    // API info endpoint
    this.app.get('/api', (_req, res) => {
      res.json({
        name: 'Symbols Awakening API',
        version: '1.0.0',
        description: 'REST API for symbolic ontology management',
        endpoints: {
          symbols: '/api/symbols',
          symbolSets: '/api/symbol-sets',
          health: '/api/health',
          docs: '/api/docs',
        },
        mcp: {
          available: true,
          tools: 11,
          description: 'MCP server also available via stdio transport',
        },
      });
    });

    // Root redirect
    this.app.get('/', (_req, res) => {
      res.redirect('/api/docs');
    });
  }

  /**
   * Set up Swagger API documentation
   */
  private setupSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Symbols Awakening API',
          version: '1.0.0',
          description: `
REST API for symbolic ontology management and reasoning.

This API provides comprehensive symbol management capabilities including:
- Symbol CRUD operations with validation
- Advanced search and filtering
- Symbol set management for collections
- Category-based organization
- CSV import/export functionality

The API runs alongside an MCP (Model Context Protocol) server that provides 
the same functionality for AI assistants and automation tools.
          `,
          contact: {
            name: 'Symbols Awakening',
            url: 'https://github.com/yogimathius/symbols-awakening-mcp',
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
        components: {
          schemas: {
            Symbol: {
              type: 'object',
              required: ['id', 'name', 'description'],
              properties: {
                id: {
                  type: 'string',
                  pattern: '^[a-zA-Z0-9_-]+$',
                  description: 'Unique identifier for the symbol',
                  example: 'infinity_symbol',
                },
                name: {
                  type: 'string',
                  maxLength: 255,
                  description: 'Human-readable name',
                  example: 'Infinity Symbol',
                },
                category: {
                  type: 'string',
                  maxLength: 100,
                  description: 'Category classification',
                  example: 'mathematical',
                },
                description: {
                  type: 'string',
                  maxLength: 2000,
                  description: 'Detailed description',
                  example: 'Mathematical symbol representing infinity and boundlessness',
                },
                interpretations: {
                  type: 'object',
                  description: 'Key-value pairs of interpretations',
                  example: {
                    mathematical: 'Represents unbounded quantity',
                    philosophical: 'Symbol of endless possibility',
                  },
                },
                related_symbols: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of related symbol IDs',
                  example: ['ouroboros', 'mandala'],
                },
                properties: {
                  type: 'object',
                  description: 'Additional metadata',
                  example: {
                    origin: 'ancient',
                    complexity: 'medium',
                  },
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation timestamp',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last update timestamp',
                },
              },
            },
            SymbolSet: {
              type: 'object',
              required: ['id', 'name', 'description'],
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier',
                  example: 'ancient_wisdom',
                },
                name: {
                  type: 'string',
                  description: 'Set name',
                  example: 'Ancient Wisdom Symbols',
                },
                category: {
                  type: 'string',
                  description: 'Category classification',
                  example: 'wisdom',
                },
                description: {
                  type: 'string',
                  description: 'Set description',
                  example: 'Collection of symbols representing ancient wisdom traditions',
                },
                symbols: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of symbol IDs in this set',
                  example: ['infinity_symbol', 'ouroboros'],
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            Error: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Resource not found',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
              },
            },
          },
        },
      },
      apis: ['./src/api/routes/*.ts'], // Path to the API files
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Symbols Awakening API Documentation',
    }));
  }

  /**
   * Set up global error handling
   */
  private setupErrorHandling(): void {
    // Handle 404 errors
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: {
          api: '/api',
          symbols: '/api/symbols',
          symbolSets: '/api/symbol-sets',
          health: '/api/health',
          docs: '/api/docs',
        },
      });
    });

    // Global error handler
    this.app.use((
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('API Error:', err);

      // Don't log the stack in production
      const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        ...(stack && { stack }),
      });
    });
  }

  /**
   * Start the API server
   */
  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          console.error(`🚀 REST API server running on http://localhost:${port}`);
          console.error(`📚 API documentation available at http://localhost:${port}/api/docs`);
          resolve();
        });

        this.server.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error('🛑 REST API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }
}