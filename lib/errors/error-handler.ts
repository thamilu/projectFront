/**
 * Error Handler
 * Centralized error handling logic
 */

import { AppError } from './custom-errors';
import { toast } from 'sonner';
import { logger } from '@/lib/observability/logger';

export interface ErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  fields?: Record<string, string>;
}

export function handleError(error: unknown): ErrorResponse {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields: 'fields' in error ? (error as any).fields : undefined,
    };
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const code = error.response?.data?.code || 'UNKNOWN_ERROR';

    return {
      message,
      code,
      statusCode: status,
      fields: error.response?.data?.fields,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

export function displayError(error: unknown): void {
  const errorResponse = handleError(error);
  
  // Display user-friendly error message
  toast.error(getUserFriendlyMessage(errorResponse));
  
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error:', { errorResponse });
  }
}

function getUserFriendlyMessage(error: ErrorResponse): string {
  const messages: Record<string, string> = {
    AUTHENTICATION_ERROR: 'Please log in to continue',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_ERROR: 'Please check your input and try again',
    NETWORK_ERROR: 'Network error. Please check your connection',
    RATE_LIMIT_ERROR: 'Too many requests. Please try again later',
    PAYMENT_ERROR: 'Payment failed. Please try again',
    INVENTORY_ERROR: 'Product is out of stock',
  };

  return messages[error.code] || error.message || 'An error occurred';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAxiosError(error: any): error is { response?: { status: number; data: any }; message: string } {
  return error && error.isAxiosError === true;
}
