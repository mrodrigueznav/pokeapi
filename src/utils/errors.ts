export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'COPY_NOT_AVAILABLE'
  | 'DECK_SLOT_FULL'
  | 'DECK_NOT_ACTIVE'
  | 'COPY_DOES_NOT_MATCH_SLOT'
  | 'LOCATION_IN_USE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(resource: string, id?: string): AppError {
  const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
  return new AppError('NOT_FOUND', message, 404);
}
