import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { logError } from './logger';
import { getHttpStatus, mapUnknownError } from './errorMapper';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function getValidatedBody<T>(req: Request): T {
  return req.validatedBody as T;
}

export function getValidatedQuery<T>(req: Request): T {
  return req.validatedQuery as T;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = getHttpStatus(err);
  const body = mapUnknownError(err);

  if (status >= 500) {
    logError(`${req.method} ${req.path} → ${body.code}: ${body.message}`, err);
  }

  res.status(status).json({ error: body });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
