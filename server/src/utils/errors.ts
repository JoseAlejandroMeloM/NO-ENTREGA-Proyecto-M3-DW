export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_STOCK'
  | 'BELOW_MINIMUM_ORDER'
  | 'INVALID_TRANSITION'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  field?: string;
  message: string;
}

/** An error that maps directly to the `Error` schema in openapi.yaml. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundError = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
