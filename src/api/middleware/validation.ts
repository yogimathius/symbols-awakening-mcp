import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Validation schemas for different parts of the request
 */
interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Middleware factory for request validation using Zod schemas
 */
export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid request body',
            details: {
              issues: bodyResult.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          });
          return;
        }
        req.body = bodyResult.data;
      }

      // Validate query parameters
      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: {
              issues: queryResult.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          });
          return;
        }
        req.query = queryResult.data;
      }

      // Validate path parameters
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid path parameters',
            details: {
              issues: paramsResult.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          });
          return;
        }
        req.params = paramsResult.data;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  };
}

/**
 * Middleware for handling async route handlers
 * Catches any unhandled promise rejections and passes them to Express error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}