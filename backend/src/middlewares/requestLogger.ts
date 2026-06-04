import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel =
      res.statusCode >= 500 ? 'ERROR' :
      res.statusCode >= 400 ? 'WARN' :
      'INFO';

    console.log(
      `[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * HTTP request logging using Morgan
 */
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms'
);
