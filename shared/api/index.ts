/**
 * Public surface of the API-route toolkit.
 *
 * Route handlers in `app/api/**` should import from this barrel only, so the
 * internal file layout can change without touching every route.
 *
 * @module shared/api
 */

export { ApiError, ApiErrorCode } from './errors';
export { apiSuccess, apiError, type ApiErrorBody } from './response';
export {
  requireSession,
  requireRole,
  readValidatedBody,
  readValidatedQuery,
  enforceRateLimit,
  getClientIp,
  DEFAULT_MAX_BODY_BYTES,
  type AuthenticatedCaller,
} from './guards';
export { withRoute, type RouteContext } from './handler';
export {
  mapUpstreamError,
  sanitiseUpstreamMessage,
  type UpstreamFailure,
} from './upstream';
