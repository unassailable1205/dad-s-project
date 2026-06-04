import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const errorMessages = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      })) || [];

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        errors: errorMessages,
      });
    }
  };
};

/**
 * Validate request query
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error: any) {
      const errorMessages = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      })) || [];

      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        statusCode: 400,
        errors: errorMessages,
      });
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error: any) {
      const errorMessages = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      })) || [];

      res.status(400).json({
        success: false,
        message: 'Params validation failed',
        statusCode: 400,
        errors: errorMessages,
      });
    }
  };
};
