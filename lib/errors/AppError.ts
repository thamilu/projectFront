export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = 'AppError'
  }

  isNotFound(): boolean {
    return this.statusCode === 404
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  isForbidden(): boolean {
    return this.statusCode === 403
  }

  isValidationError(): boolean {
    return this.statusCode === 422
  }

  isConflict(): boolean {
    return this.statusCode === 409
  }
}

export const ErrorCodes = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_CANCELLATION_EXPIRED: 'ORDER_CANCELLATION_EXPIRED',
  SELLER_NOT_APPROVED: 'SELLER_NOT_APPROVED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const
