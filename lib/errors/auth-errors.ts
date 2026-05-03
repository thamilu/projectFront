export enum AuthErrorCode {
  CONFIG_NOT_FOUND = 'AUTH_1001',
  STATE_MISSING = 'AUTH_2001',
  STATE_EXPIRED = 'AUTH_2002',
  STATE_MISMATCH = 'AUTH_2003',
  TOKEN_EXCHANGE_FAILED = 'AUTH_3001',
  TOKEN_INVALID = 'AUTH_3002',
  RATE_LIMIT_EXCEEDED = 'AUTH_5001',
  OPEN_REDIRECT_BLOCKED = 'AUTH_5004',
  IDP_UNREACHABLE = 'AUTH_6001',
  CIRCUIT_OPEN = 'AUTH_6003',
  UNKNOWN = 'AUTH_9999',
}

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends AuthError {
  constructor(public retryAfter: number, message = 'Too many requests') {
    super(AuthErrorCode.RATE_LIMIT_EXCEEDED, message);
    this.name = 'RateLimitError';
  }
}

export class IdpError extends AuthError {
  constructor(code: AuthErrorCode, message: string) {
    super(code, message);
    this.name = 'IdpError';
  }
}
	