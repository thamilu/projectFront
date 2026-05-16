/**
 * Standardized Enterprise Error Handling
 * 
 * Follows backend ApiError format for frontend-backend parity.
 */

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  errorCode: string;
  message: string;
  path: string;
  correlationId?: string;
}

export class AppError extends Error {
  public status: number;
  public errorCode: string;
  public details?: any;

  constructor(message: string, status = 500, errorCode = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Global handler to normalize API errors into AppError format
 */
export function handleApiError(error: any): never {
  if (error.response?.data) {
    const apiError = error.response.data as ApiError;
    throw new AppError(
      apiError.message || 'An unexpected error occurred',
      apiError.status || error.response.status,
      apiError.errorCode || 'API_ERROR'
    );
  }
  
  if (error.request) {
    throw new AppError('No response received from server', 503, 'NETWORK_ERROR');
  }

  throw new AppError(error.message || 'Unknown Error', 500, 'UNKNOWN_ERROR');
}
