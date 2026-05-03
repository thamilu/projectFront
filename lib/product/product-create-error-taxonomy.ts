import { ProductPayloadValidationError } from '@/lib/product/backend-mapper';

export type ProductCreateErrorCategory = 'validation' | 'transport' | 'server_contract' | 'unknown';

type ErrorLike = {
  message?: string;
  status?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
    };
  };
};

export interface NormalizedProductCreateError {
  category: ProductCreateErrorCategory;
  status: number;
  message: string;
  userMessage: string;
  logLevel: 'warn' | 'error';
  retryable: boolean;
}

function extractError(error: unknown): {
  status: number;
  message: string;
  hasFieldErrors: boolean;
} {
  const err = error as ErrorLike;
  const status = err?.response?.status ?? err?.status ?? 0;
  const message =
    err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
  const hasFieldErrors = Boolean(err?.response?.data?.errors);

  return { status, message, hasFieldErrors };
}

export function normalizeProductCreateError(error: unknown): NormalizedProductCreateError {
  if (error instanceof ProductPayloadValidationError) {
    return {
      category: 'validation',
      status: 400,
      message: error.message,
      userMessage: 'Product form data is invalid. Please check required fields',
      logLevel: 'warn',
      retryable: false,
    };
  }

  const { status, message, hasFieldErrors } = extractError(error);
  const lowerMessage = message.toLowerCase();

  if (
    status === 0 ||
    lowerMessage.includes('network error') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('unable to reach the server')
  ) {
    return {
      category: 'transport',
      status,
      message,
      userMessage: 'Network issue while creating product. Please retry',
      logLevel: 'error',
      retryable: true,
    };
  }

  if (
    status === 400 &&
    (lowerMessage.includes('invalid request content') ||
      lowerMessage.includes('cannot deserialize') ||
      lowerMessage.includes('json parse'))
  ) {
    return {
      category: 'server_contract',
      status,
      message,
      userMessage: 'Server rejected the request format. Please contact support',
      logLevel: 'error',
      retryable: false,
    };
  }

  if (status === 400 || status === 422 || hasFieldErrors) {
    return {
      category: 'validation',
      status,
      message,
      userMessage: message,
      logLevel: 'warn',
      retryable: false,
    };
  }

  return {
    category: 'unknown',
    status,
    message,
    userMessage: message || 'Failed to create product',
    logLevel: 'error',
    retryable: status >= 500 || status === 0,
  };
}
