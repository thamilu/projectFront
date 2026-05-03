export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = 'API_ERROR', public readonly errors?: ValidationError[]) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'INSUFFICIENT_PERMISSIONS');
    this.name = 'AuthorizationError';
  }
}

export class ValidationApiError extends ApiError {
  constructor(message: string, errors: ValidationError[]) {
    super(400, message, 'VALIDATION_FAILED', errors);
    this.name = 'ValidationApiError';
  }
}

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

export async function handleApiError(response: Response): Promise<never> {
  let body: ApiErrorResponse | null = null;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, `Server error: ${response.statusText}`);
  }

  const message = body?.message || body?.error || 'An error occurred';

  switch (response.status) {
    case 400:
      if (body?.errors && body.errors.length) throw new ValidationApiError(message, body.errors);
      throw new ApiError(400, message, 'BAD_REQUEST');
    case 401:
      throw new AuthenticationError(message);
    case 403:
      throw new AuthorizationError(message);
    case 404:
      throw new ApiError(404, message, 'NOT_FOUND');
    case 422:
      throw new ValidationApiError(message, body?.errors ?? []);
    default:
      throw new ApiError(response.status, response.status >= 500 ? 'Server error. Please try again later.' : message, response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR');
  }
}
