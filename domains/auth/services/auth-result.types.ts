// ============================================================
// features/auth/services/auth-result.types.ts
// Typed result pattern — service methods never throw to callers.
// Models both success and failure paths explicitly.
// ============================================================

// ─── Error Codes ─────────────────────────────────────────────

/**
 * Exhaustive enumeration of all possible auth failure reasons.
 * Used by consumers to handle specific error cases distinctly.
 */
export enum AuthErrorCode {
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT_FAILED = 'LOGOUT_FAILED',
  SESSION_FETCH_FAILED = 'SESSION_FETCH_FAILED',
  SESSION_VALIDATION_FAILED = 'SESSION_VALIDATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN',
}

// ─── Error Shape ─────────────────────────────────────────────

/**
 * Structured error model returned in failure results.
 * Never exposes raw errors to consumers — always serialized.
 */
export interface AuthError {
  /** Machine-readable error classification */
  readonly code: AuthErrorCode;
  /** Human-readable message safe for UI display */
  readonly message: string;
  /** Original caught error for logging/debugging only */
  readonly originalError?: unknown;
}

// ─── Result Union ─────────────────────────────────────────────

/** Successful result carrying optional typed payload */
export interface AuthSuccess<T> {
  readonly success: true;
  readonly data: T;
}

/** Failure result carrying structured error information */
export interface AuthFailure {
  readonly success: false;
  readonly error: AuthError;
}

/**
 * Discriminated union result type.
 * Consumers narrow via `result.success` before accessing data.
 *
 * @example
 * const result = await authService.initiateLogin();
 * if (result.success) {
 *   // result.data is available
 * } else {
 *   // result.error.code and result.error.message are available
 * }
 */
export type AuthResult<T = void> = AuthSuccess<T> | AuthFailure;

// ─── Builder Helpers ──────────────────────────────────────────

/**
 * Convenience factory for creating typed AuthResult values.
 * Eliminates repetitive object construction throughout the service.
 *
 * @example
 * return AR.ok(undefined);
 * return AR.fail(AuthErrorCode.LOGIN_FAILED, 'Login failed', error);
 */
export const AR = {
  ok<T>(data: T): AuthSuccess<T> {
    return { success: true, data };
  },

  fail(code: AuthErrorCode, message: string, originalError?: unknown): AuthFailure {
    return {
      success: false,
      error: { code, message, originalError },
    };
  },
} as const;

// ─── Type Guards ──────────────────────────────────────────────

/** Type guard — narrows to AuthSuccess<T> */
export function isAuthSuccess<T>(result: AuthResult<T>): result is AuthSuccess<T> {
  return result.success === true;
}

/** Type guard — narrows to AuthFailure */
export function isAuthFailure<T>(result: AuthResult<T>): result is AuthFailure {
  return result.success === false;
}
