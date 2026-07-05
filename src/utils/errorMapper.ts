import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from './errors';

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  hint?: string;
  details: Record<string, unknown>;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function formatZodError(error: ZodError): ApiErrorBody {
  const fields = error.errors.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
    code: issue.code,
  }));

  const summary = fields.map((f) => `${f.field}: ${f.message}`).join('; ');

  return {
    code: 'VALIDATION_ERROR',
    message: summary ? `Invalid request body — ${summary}` : 'Invalid request body',
    hint: 'Check the API docs for required fields and allowed values.',
    details: { fields },
  };
}

export function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  const meta = (error.meta ?? {}) as Record<string, unknown>;

  switch (error.code) {
    case 'P2002':
      return new AppError(
        'CONFLICT',
        'A record with the same unique value already exists',
        409,
        { prismaCode: error.code, ...meta },
        'Change the conflicting value or update the existing record instead.'
      );

    case 'P2003':
      return new AppError(
        'VALIDATION_ERROR',
        'A referenced record does not exist (invalid foreign key)',
        400,
        { prismaCode: error.code, ...meta },
        'Verify IDs such as catalogCardId, locationId, deckId, or physicalCopyId exist.'
      );

    case 'P2021':
      return new AppError(
        'DATABASE_NOT_READY',
        `Database table does not exist: ${meta.table ?? 'unknown'}`,
        503,
        { prismaCode: error.code, ...meta },
        'Apply database migrations: npm run prisma:migrate:deploy'
      );

    case 'P2025':
      return new AppError(
        'NOT_FOUND',
        'The requested record was not found',
        404,
        { prismaCode: error.code, ...meta }
      );

    case 'P1001':
    case 'P1002':
      return new AppError(
        'DATABASE_ERROR',
        'Unable to connect to the database',
        503,
        { prismaCode: error.code, ...meta },
        'Verify DATABASE_URL and that the database server is reachable.'
      );

    default:
      return new AppError(
        'DATABASE_ERROR',
        `Database operation failed (${error.code})`,
        500,
        { prismaCode: error.code, message: error.message, ...meta }
      );
  }
}

export function mapUnknownError(error: unknown): ApiErrorBody {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.hint && { hint: error.hint }),
      details: error.details ?? {},
    };
  }

  if (error instanceof ZodError) {
    return formatZodError(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(error);
    return {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.hint && { hint: mapped.hint }),
      details: mapped.details ?? {},
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Unable to connect to the database',
      hint: 'Verify DATABASE_URL is correct and the database server is reachable.',
      details: isProduction() ? {} : { message: error.message },
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid data sent to the database',
      hint: 'Check that all required fields have the correct types.',
      details: {
        prismaError: isProduction() ? undefined : error.message,
      },
    };
  }

  if (error instanceof Error) {
    const isExternalApi = error.message.includes('Pokemon TCG API');
    return {
      code: isExternalApi ? 'EXTERNAL_API_ERROR' : 'INTERNAL_ERROR',
      message: isExternalApi
        ? `External Pokémon TCG API error: ${error.message}`
        : error.message || 'An unexpected error occurred',
      hint: isExternalApi
        ? 'The card may still be created with minimal catalog data if you retry, or set POKEMON_TCG_API_KEY.'
        : undefined,
      details: isProduction()
        ? {}
        : { name: error.name, stack: error.stack?.split('\n').slice(0, 8) },
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    details: {},
  };
}

export function getHttpStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof ZodError) return 400;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mapPrismaError(error).statusCode;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) return 503;
  if (error instanceof Prisma.PrismaClientValidationError) return 400;
  if (error instanceof Error && error.message.includes('Pokemon TCG API')) return 502;
  return 500;
}
