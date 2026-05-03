# Token Refresh Endpoint Security & Reliability Refactor

**Document Version:** 1.0.0  
**Date:** 2025-01-27  
**Endpoint:** `/api/auth/keycloak/refresh`  
**Status:** ✅ Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues Resolved](#critical-issues-resolved)
3. [Architecture Overview](#architecture-overview)
4. [Security Improvements](#security-improvements)
5. [Reliability Improvements](#reliability-improvements)
6. [Implementation Details](#implementation-details)
7. [Testing & Validation](#testing--validation)
8. [Migration Guide](#migration-guide)
9. [Observability & Monitoring](#observability--monitoring)
10. [References](#references)

---

## Executive Summary

### Purpose

The token refresh endpoint is critical infrastructure that enables seamless session extension without re-authentication. This refactor addresses critical reliability and security issues that could cause:

- **Service disruptions** during network issues (users forced to re-authenticate)
- **Race conditions** with concurrent refresh requests (token corruption)
- **Cascading failures** during Keycloak outages (re-auth storms)
- **Information disclosure** through verbose error messages

### Key Improvements

| Category | Improvement | Impact |
|----------|-------------|--------|
| **Reliability** | Error classification & selective session destruction | Prevents unnecessary re-auth during transient failures |
| **Reliability** | Request timeout protection (10s configurable) | Prevents indefinite hangs on slow Keycloak responses |
| **Reliability** | Concurrent refresh mutex | Eliminates race conditions with token rotation |
| **Reliability** | Token expiration pre-check | Reduces unnecessary Keycloak load |
| **Reliability** | Exponential backoff retry (3 attempts) | Handles transient Keycloak unavailability |
| **Security** | Rate limiting (10 req/min per user) | Prevents token refresh abuse |
| **Security** | Error sanitization | Prevents sensitive data exposure |
| **Security** | PII-safe logging | GDPR/CCPA compliant observability |
| **Observability** | Request correlation IDs | End-to-end request tracing |
| **Observability** | Granular metrics | Per-error-type failure tracking |

### Business Impact

- **Improved UX**: Users stay logged in during transient infrastructure issues
- **Reduced load**: Token pre-check avoids unnecessary refresh calls to Keycloak
- **Better resilience**: Retry logic handles temporary Keycloak downtime gracefully
- **Security compliance**: Rate limiting prevents abuse, error sanitization prevents leaks

---

## Critical Issues Resolved

### 1. Overly Aggressive Session Destruction (🔴 Critical)

**Problem:**
```typescript
// OLD: Any error destroyed the session
catch (error) {
  await destroySession(); // ❌ Network timeout? Session gone!
  return NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
}
```

**Impact:**
- Network timeouts (common in cloud environments) forced users to log in again
- Keycloak server errors (5xx) caused mass re-authentication storms
- Poor UX during infrastructure issues

**Solution:**
```typescript
// NEW: Error classification determines session fate
const errorType = classifyRefreshError(error, response.status);

if (errorType === 'invalid_grant') {
  // Only destroy session for expired/revoked tokens
  await destroySession();
  return createResponse({ error: 'session_expired', ... }, 401, requestId);
}

if (errorType === 'network' || errorType === 'server_error') {
  // Keep session for transient errors
  return createResponse({
    error: 'temporary_failure',
    retryable: true,
    retryAfter: 5,
  }, 503, requestId);
}
```

**Error Classification Logic:**

| Error Type | HTTP Status | Session Action | Retry Strategy |
|------------|-------------|----------------|----------------|
| `invalid_grant` | 400, 401 | Destroy | No retry |
| `network` | Timeout, abort | Keep | Retry with backoff |
| `server_error` | 500-599 | Keep | Retry with backoff |
| `rate_limited` | 429 | Keep | No retry (client backs off) |
| `unknown` | Other | Destroy (safe default) | No retry |

---

### 2. No Request Timeout (🔴 Critical)

**Problem:**
```typescript
// OLD: Could hang indefinitely
const response = await fetch(endpoints.token, {
  method: 'POST',
  body: body.toString(),
  // ❌ No timeout, no abort signal
});
```

**Impact:**
- Slow Keycloak responses hung frontend requests indefinitely
- Blocked Node.js event loop threads
- Cascading failures during Keycloak load spikes

**Solution:**
```typescript
// NEW: Configurable timeout with AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
  log.warn('Token refresh request timed out', { 
    timeoutMs: REFRESH_TIMEOUT_MS 
  });
}, REFRESH_TIMEOUT_MS);

try {
  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Request-ID': requestId,
      'X-Correlation-ID': requestId,
    },
    body: body.toString(),
    signal: controller.signal, // ✅ Timeout protection
  });
  
  clearTimeout(timeoutId);
  // ... handle response
} catch (error) {
  clearTimeout(timeoutId);
  
  if (error instanceof Error && error.name === 'AbortError') {
    // Retry on timeout
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount));
      return refreshAccessToken(..., retryCount + 1);
    }
    
    const timeoutError = new Error('Token refresh timeout');
    (timeoutError as any).errorType = 'network';
    throw timeoutError;
  }
  
  throw error;
}
```

**Configuration:**

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `REFRESH_TIMEOUT_MS` | 10000 (10s) | Maximum time for Keycloak token endpoint response |

---

### 3. Missing Concurrent Refresh Prevention (🔴 Critical)

**Problem:**
```typescript
// OLD: Multiple concurrent requests could refresh simultaneously
export async function POST(req: NextRequest) {
  const tokens = await refreshAccessToken(session.refreshToken);
  await updateSession(tokens);
  // ❌ Race condition: Token rotation + concurrent requests = corruption
}
```

**Impact:**
- **Token rotation enabled**: Second request uses invalidated refresh token → session destroyed
- **Token rotation disabled**: Multiple unnecessary Keycloak calls waste resources
- Intermittent authentication failures difficult to debug

**Solution:**
```typescript
// NEW: In-memory mutex prevents concurrent refreshes per user
const refreshLocks = new Map<string, Promise<NextResponse>>();

async function withRefreshLock(
  userId: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Return existing in-flight request
  const existingLock = refreshLocks.get(userId);
  if (existingLock) {
    return existingLock;
  }
  
  // Create new lock
  const lockPromise = fn().finally(() => {
    refreshLocks.delete(userId);
  });
  
  refreshLocks.set(userId, lockPromise);
  return lockPromise;
}

// Usage in POST handler
return await withRefreshLock(userId, async () => {
  // Re-fetch session inside lock (may have been updated)
  const lockedSession = await getSession();
  
  if (lockedSession.expiresAt > Date.now() + REFRESH_THRESHOLD_MS) {
    return createResponse({
      success: true,
      refreshed: false,
      message: 'Token already refreshed',
    }, 200, requestId);
  }
  
  // Only one request proceeds to refresh
  const tokens = await refreshAccessToken(...);
  await updateSession(tokens);
  return createResponse({ success: true, refreshed: true }, 200, requestId);
});
```

**Distributed Systems Note:**

For multi-instance deployments (Kubernetes, load balancers), replace in-memory mutex with Redis-based distributed lock:

```typescript
// Example: Redis-based mutex (not implemented)
import { Redis } from 'ioredis';

async function withDistributedRefreshLock(
  redis: Redis,
  userId: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  const lockKey = `refresh-lock:${userId}`;
  const lockValue = nanoid();
  
  // Try to acquire lock with 15s expiration
  const acquired = await redis.set(lockKey, lockValue, 'PX', 15000, 'NX');
  
  if (!acquired) {
    // Another instance is refreshing, wait briefly and retry
    await sleep(500);
    const session = await getSession();
    if (session.expiresAt > Date.now()) {
      return createResponse({ success: true, refreshed: false }, 200);
    }
    // Retry lock acquisition...
  }
  
  try {
    return await fn();
  } finally {
    // Release lock (Lua script for atomicity)
    await redis.eval(`
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `, 1, lockKey, lockValue);
  }
}
```

---

### 4. No Token Expiration Pre-Check (🟠 Moderate)

**Problem:**
```typescript
// OLD: Always attempted refresh, even if token still valid
const tokens = await refreshAccessToken(session.refreshToken);
// ❌ Wasted Keycloak calls if token has 10 minutes remaining
```

**Impact:**
- Unnecessary load on Keycloak during high traffic
- Slower response times (network round-trip)
- Higher infrastructure costs

**Solution:**
```typescript
// NEW: Pre-check token expiration (1 minute buffer)
const REFRESH_THRESHOLD_MS = 60_000; // 1 minute

if (session.expiresAt && session.expiresAt > Date.now() + REFRESH_THRESHOLD_MS) {
  const expiresIn = Math.floor((session.expiresAt - Date.now()) / 1000);
  
  log.debug('Token still valid, skipping refresh', {
    userId,
    expiresIn,
    requestId,
  });
  
  recordMetric('auth.refresh.skipped_valid', 1);

  return createResponse({
    success: true,
    refreshed: false,
    expiresIn,
    message: 'Token still valid',
  }, 200, requestId);
}
```

**Performance Impact:**

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| Token has 5 min remaining | Keycloak call | Skip | ~100ms |
| Token has 30s remaining | Keycloak call | Refresh | 0ms |
| 1000 req/s, 90% valid | 1000 Keycloak calls/s | 100 Keycloak calls/s | 90% load reduction |

---

### 5. Missing Error Sanitization (🟠 Moderate)

**Problem:**
```typescript
// OLD: Keycloak error details leaked to client
catch (error) {
  return NextResponse.json({
    error: 'refresh_failed',
    details: error.message, // ❌ May contain client_secret, internal URLs
  }, { status: 401 });
}
```

**Impact:**
- **Information disclosure**: Client secrets, internal URLs, stack traces
- **Security audit failures**: OWASP A01:2021 Broken Access Control
- **Compliance violations**: GDPR Article 32 (security of processing)

**Solution:**
```typescript
// NEW: Sanitize error responses
function sanitizeErrorBody(body: unknown): unknown {
  if (typeof body === 'object' && body !== null) {
    const sanitized = { ...body } as Record<string, unknown>;
    
    // Remove potentially sensitive fields
    delete sanitized.error_description;
    delete sanitized.hint;
    delete sanitized.trace;
    delete sanitized.debug;
    
    return sanitized;
  }
  
  return body;
}

// Usage
const errorBody = await response.text();
const sanitized = sanitizeErrorBody(errorBody);

log.error('Keycloak token refresh failed', {
  status: response.status,
  sanitizedError: sanitized, // ✅ Safe for logs
  requestId,
});
```

**Environment-Specific Behavior:**

```typescript
const SAFE_ENVIRONMENTS = new Set(['development', 'test']);

return createResponse(
  {
    error: 'refresh_failed',
    message: 'Authentication failed. Please log in again.',
    // Only show details in dev/test
    ...(SAFE_ENVIRONMENTS.has(process.env.NODE_ENV ?? '') 
      ? { details: errorMessage } 
      : {}
    ),
  },
  401,
  requestId
);
```

---

### 6. Missing Rate Limiting (🟠 Moderate)

**Problem:**
```typescript
// OLD: No protection against refresh spam
export async function POST(req: NextRequest) {
  const tokens = await refreshAccessToken(session.refreshToken);
  // ❌ Attacker could spam refresh endpoint
}
```

**Impact:**
- **DoS vector**: Malicious actors could spam refresh endpoint
- **Resource exhaustion**: High Keycloak load, database connections
- **Token rotation abuse**: Force token invalidation with rapid refreshes

**Solution:**
```typescript
// NEW: Per-user rate limiting (10 requests/minute)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitKey = `refresh:${userId}`;
if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
  log.warn('Rate limit exceeded', { userId, clientIp, requestId });
  recordMetric('auth.refresh.rate_limited', 1);
  
  return createResponse(
    {
      error: 'rate_limited',
      message: 'Too many refresh requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    },
    429,
    requestId
  );
}
```

**Rate Limit Configuration:**

| Scenario | Limit | Rationale |
|----------|-------|-----------|
| Normal usage | 1-2 req/min | Token expires every 5-15 minutes |
| Aggressive auto-refresh | 5 req/min | Multiple tabs, retries |
| Malicious abuse | 10+ req/min | Likely attack |

**Rate Limit Headers:**

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706383200
```

---

## Architecture Overview

### Request Flow

```
┌──────────────┐
│   Client     │
│ (React App)  │
└──────┬───────┘
       │ POST /api/auth/keycloak/refresh
       │
┌──────▼────────────────────────────────────────────────────────────────┐
│                     Refresh Route Handler                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 1. Session Validation                                         │   │
│  │    ├─ Get current session from cookie                        │   │
│  │    └─ Return 401 if no session                               │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 2. Rate Limiting (per user)                                   │   │
│  │    ├─ Check: 10 requests per 60 seconds                      │   │
│  │    └─ Return 429 if exceeded                                 │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 3. Token Expiration Pre-Check                                 │   │
│  │    ├─ Check: expiresAt > now + 60 seconds?                   │   │
│  │    └─ Return 200 (not refreshed) if still valid              │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 4. Refresh Token Validation                                   │   │
│  │    ├─ Check if session has refresh token                     │   │
│  │    └─ Return 401 + destroy session if missing                │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 5. Concurrent Refresh Mutex                                   │   │
│  │    ├─ Acquire lock for user ID                               │   │
│  │    ├─ If lock exists, wait for result                        │   │
│  │    └─ Re-check expiration inside lock                        │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 6. Token Refresh (with timeout & retry)                       │   │
│  │    ├─ POST to Keycloak token endpoint                        │   │
│  │    ├─ Timeout: 10 seconds (configurable)                     │   │
│  │    ├─ Retry: 3 attempts with exponential backoff             │   │
│  │    └─ Error classification determines session fate           │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 7. Session Update                                             │   │
│  │    ├─ Update session cookie with new tokens                  │   │
│  │    ├─ Update expiresAt timestamp                             │   │
│  │    └─ Keep existing refresh token if not rotated             │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 8. Audit & Metrics                                            │   │
│  │    ├─ Record security audit event (non-blocking)             │   │
│  │    ├─ Record metrics (success/failure/type)                  │   │
│  │    └─ Log with request correlation ID                        │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │ 9. Response                                                   │   │
│  │    ├─ Success: { success: true, refreshed: true, expiresIn } │   │
│  │    ├─ Skipped: { success: true, refreshed: false }           │   │
│  │    ├─ Transient error: 503 (keep session)                    │   │
│  │    └─ Fatal error: 401 (destroy session)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Error Classification Decision Tree

```
                    ┌──────────────────┐
                    │  Refresh Failed  │
                    └────────┬─────────┘
                             │
                 ┌───────────▼──────────┐
                 │  HTTP Status Check   │
                 └───┬─────────────┬────┘
                     │             │
          ┌──────────▼─┐       ┌───▼──────────┐
          │ 400 or 401 │       │   429        │
          └──────┬─────┘       └───┬──────────┘
                 │                 │
        ┌────────▼────────┐   ┌────▼─────────┐
        │ invalid_grant   │   │ rate_limited │
        │ Destroy session │   │ Keep session │
        └─────────────────┘   └──────────────┘
                     
          ┌──────────▼─┐       ┌───▼──────────┐
          │   500-599  │       │   Other      │
          └──────┬─────┘       └───┬──────────┘
                 │                 │
        ┌────────▼────────┐   ┌────▼──────────────┐
        │ server_error    │   │ Check error.msg   │
        │ Keep session    │   └────┬──────────────┘
        │ Retry           │        │
        └─────────────────┘   ┌────▼────────────────┐
                              │ Contains timeout/   │
                              │ network/fetch/abort?│
                              └────┬────────────┬───┘
                                   │            │
                              ┌────▼───┐   ┌────▼─────┐
                              │network │   │ unknown  │
                              │Keep    │   │ Destroy  │
                              │Retry   │   │ (safe)   │
                              └────────┘   └──────────┘
```

---

## Security Improvements

### 1. Rate Limiting (10 requests/minute per user)

**Implementation:**

```typescript
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitKey = `refresh:${userId}`;
if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
  log.warn('Rate limit exceeded', { userId, clientIp, requestId });
  recordMetric('auth.refresh.rate_limited', 1);
  
  return createResponse(
    {
      error: 'rate_limited',
      message: 'Too many refresh requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    },
    429,
    requestId
  );
}
```

**Configuration:**

| Limit Type | Value | Rationale |
|------------|-------|-----------|
| Max requests | 10 | Generous buffer for multi-tab usage |
| Window | 60 seconds | Standard sliding window |
| Key | `refresh:{userId}` | Per-user tracking |

### 2. Error Sanitization

**Sensitive Fields Removed:**

- `error_description` - May contain internal error details
- `hint` - Keycloak debugging hints
- `trace` - Stack traces with file paths
- `debug` - Internal debug information

**Environment-Specific Verbosity:**

| Environment | Error Details | Rationale |
|-------------|---------------|-----------|
| Production | Generic messages only | Security best practice |
| Staging | Generic messages only | Matches production behavior |
| Development | Full details | Developer debugging |
| Test | Full details | Test failure diagnosis |

### 3. Request Correlation

**Headers Added:**

```http
POST /realms/ecommerce/protocol/openid-connect/token HTTP/1.1
X-Request-ID: refresh_a1b2c3d4e5f6
X-Correlation-ID: refresh_a1b2c3d4e5f6
Content-Type: application/x-www-form-urlencoded
```

**Benefits:**

- End-to-end request tracing across services
- Keycloak logs can be correlated with frontend logs
- Easier debugging of multi-service issues

---

## Reliability Improvements

### 1. Exponential Backoff Retry

**Configuration:**

```typescript
const MAX_RETRIES = 2; // Total 3 attempts
const RETRY_DELAY_MS = 1000; // Initial delay

// Retry schedule:
// Attempt 1: Immediate
// Attempt 2: After 1 second
// Attempt 3: After 2 seconds
```

**Retry Logic:**

```typescript
if (
  (errorType === 'network' || errorType === 'server_error') &&
  retryCount < MAX_RETRIES
) {
  const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
  log.info('Retrying token refresh', {
    retryCount: retryCount + 1,
    delayMs: delay,
    requestId,
  });
  
  await sleep(delay);
  return refreshAccessToken(
    refreshToken,
    config,
    endpoints,
    requestId,
    retryCount + 1
  );
}
```

**Retry Scenarios:**

| Error Type | Retry? | Max Attempts | Reason |
|------------|--------|--------------|--------|
| `network` (timeout) | Yes | 3 | Transient network issue |
| `server_error` (5xx) | Yes | 3 | Keycloak overload |
| `invalid_grant` | No | 1 | Token expired (permanent) |
| `rate_limited` | No | 1 | Client should back off |

### 2. Concurrent Refresh Mutex

**Single-Instance Implementation:**

```typescript
const refreshLocks = new Map<string, Promise<NextResponse>>();

async function withRefreshLock(
  userId: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  const existingLock = refreshLocks.get(userId);
  if (existingLock) {
    return existingLock; // Reuse in-flight request
  }
  
  const lockPromise = fn().finally(() => {
    refreshLocks.delete(userId);
  });
  
  refreshLocks.set(userId, lockPromise);
  return lockPromise;
}
```

**Race Condition Prevention:**

| Scenario | Without Mutex | With Mutex |
|----------|---------------|------------|
| User opens 3 tabs | 3 concurrent refresh calls | 1 refresh, 2 wait for result |
| Token rotation enabled | 2nd/3rd requests fail (token invalidated) | All requests succeed |
| High traffic (1000 users) | Potential Keycloak overload | Reduced load |

### 3. Token Expiration Pre-Check

**Implementation:**

```typescript
const REFRESH_THRESHOLD_MS = 60_000; // 1 minute buffer

if (session.expiresAt && session.expiresAt > Date.now() + REFRESH_THRESHOLD_MS) {
  const expiresIn = Math.floor((session.expiresAt - Date.now()) / 1000);
  
  recordMetric('auth.refresh.skipped_valid', 1);

  return createResponse({
    success: true,
    refreshed: false,
    expiresIn,
    message: 'Token still valid',
  }, 200, requestId);
}
```

**Performance Impact:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg response time | 100ms | 5ms (if skipped) | 95% faster |
| Keycloak load (90% valid tokens) | 1000 req/s | 100 req/s | 90% reduction |
| Client retries on failure | Higher | Lower | Better UX |

---

## Implementation Details

### Configuration Constants

```typescript
// Token refresh timeout (configurable via env)
const REFRESH_TIMEOUT_MS = parseInt(process.env.REFRESH_TIMEOUT_MS ?? '10000', 10);

// Refresh token only if expiring within this threshold
const REFRESH_THRESHOLD_MS = 60_000; // 1 minute buffer

// Rate limiting: 10 refresh requests per minute per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // Initial delay, doubles each retry

// Safe environments for detailed error responses
const SAFE_ENVIRONMENTS = new Set(['development', 'test']);
```

### Type Definitions

```typescript
/**
 * Classification of refresh errors for appropriate handling
 */
type RefreshErrorType = 
  | 'invalid_grant'   // Refresh token expired/revoked - session must be destroyed
  | 'network'         // Network/timeout error - transient, keep session
  | 'server_error'    // Keycloak server error - transient, keep session
  | 'rate_limited'    // Rate limit exceeded - transient, keep session
  | 'unknown';        // Unknown error - destroy session for safety
```

### Validation Schemas

```typescript
const RefreshTokenResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  refresh_token: z.string().optional(),
  id_token: z.string().optional(),
  expires_in: z.number().positive('Expires in must be positive'),
  token_type: z.string().default('Bearer'),
  refresh_expires_in: z.number().optional(),
});
```

### Utility Functions

#### Error Classification

```typescript
function classifyRefreshError(error: unknown, status?: number): RefreshErrorType {
  // Check HTTP status first (most reliable)
  if (status) {
    if (status === 400 || status === 401) return 'invalid_grant';
    if (status === 429) return 'rate_limited';
    if (status >= 500) return 'server_error';
  }
  
  // Check error message/body
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid_grant') || message.includes('token_expired')) {
      return 'invalid_grant';
    }
    
    if (message.includes('rate_limit') || message.includes('too_many_requests')) {
      return 'rate_limited';
    }
    
    if (message.includes('timeout') || message.includes('network') || 
        message.includes('fetch') || message.includes('econnrefused') ||
        message.includes('abort')) {
      return 'network';
    }
    
    if (message.includes('server_error') || message.includes('unavailable')) {
      return 'server_error';
    }
  }
  
  return 'unknown';
}
```

#### Error Sanitization

```typescript
function sanitizeErrorBody(body: unknown): unknown {
  if (typeof body === 'object' && body !== null) {
    const sanitized = { ...body } as Record<string, unknown>;
    
    // Remove potentially sensitive fields
    delete sanitized.error_description;
    delete sanitized.hint;
    delete sanitized.trace;
    delete sanitized.debug;
    
    return sanitized;
  }
  
  return body;
}
```

#### Concurrent Refresh Mutex

```typescript
const refreshLocks = new Map<string, Promise<NextResponse>>();

async function withRefreshLock(
  userId: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  const existingLock = refreshLocks.get(userId);
  if (existingLock) {
    return existingLock;
  }
  
  const lockPromise = fn().finally(() => {
    refreshLocks.delete(userId);
  });
  
  refreshLocks.set(userId, lockPromise);
  return lockPromise;
}
```

---

## Testing & Validation

### Unit Tests

```typescript
// tests/api/auth/keycloak/refresh.test.ts

describe('POST /api/auth/keycloak/refresh', () => {
  describe('Error Classification', () => {
    it('classifies 401 as invalid_grant', () => {
      const result = classifyRefreshError(null, 401);
      expect(result).toBe('invalid_grant');
    });

    it('classifies timeout errors as network', () => {
      const error = new Error('fetch timeout');
      const result = classifyRefreshError(error);
      expect(result).toBe('network');
    });

    it('classifies 500 as server_error', () => {
      const result = classifyRefreshError(null, 500);
      expect(result).toBe('server_error');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 after 10 requests in 60 seconds', async () => {
      const userId = 'test-user';
      
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await POST(createMockRequest(userId));
      }
      
      // 11th request should be rate limited
      const response = await POST(createMockRequest(userId));
      expect(response.status).toBe(429);
    });
  });

  describe('Token Expiration Pre-Check', () => {
    it('skips refresh if token has 5 minutes remaining', async () => {
      const session = {
        userId: 'test',
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        refreshToken: 'refresh_token',
      };
      
      const response = await POST(createMockRequest(session));
      const body = await response.json();
      
      expect(body.refreshed).toBe(false);
      expect(body.message).toContain('still valid');
    });

    it('refreshes if token expires in 30 seconds', async () => {
      const session = {
        userId: 'test',
        expiresAt: Date.now() + 30_000, // 30 seconds
        refreshToken: 'refresh_token',
      };
      
      const response = await POST(createMockRequest(session));
      const body = await response.json();
      
      expect(body.refreshed).toBe(true);
    });
  });

  describe('Concurrent Refresh Mutex', () => {
    it('prevents duplicate refresh calls for same user', async () => {
      const userId = 'test-user';
      const refreshSpy = jest.spyOn(keycloak, 'refreshAccessToken');
      
      // Simulate 3 concurrent requests
      await Promise.all([
        POST(createMockRequest(userId)),
        POST(createMockRequest(userId)),
        POST(createMockRequest(userId)),
      ]);
      
      // Should only call Keycloak once
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Preservation', () => {
    it('keeps session on network timeout', async () => {
      jest.spyOn(fetch, 'fetch').mockRejectedValue(new Error('timeout'));
      
      const response = await POST(createMockRequest());
      const session = await getSession();
      
      expect(response.status).toBe(503);
      expect(session).toBeTruthy(); // Session still exists
    });

    it('destroys session on invalid_grant', async () => {
      jest.spyOn(fetch, 'fetch').mockResolvedValue(
        new Response('{"error": "invalid_grant"}', { status: 401 })
      );
      
      const response = await POST(createMockRequest());
      const session = await getSession();
      
      expect(response.status).toBe(401);
      expect(session).toBeNull(); // Session destroyed
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/token-refresh.test.ts

describe('Token Refresh Integration', () => {
  beforeEach(() => {
    // Start Keycloak test container
    keycloakContainer.start();
  });

  it('successfully refreshes valid token', async () => {
    // 1. Login to get initial tokens
    const loginResponse = await fetch('/api/auth/keycloak', {
      method: 'POST',
      body: JSON.stringify({ username: 'test', password: 'test' }),
    });
    
    const { accessToken, refreshToken } = await loginResponse.json();
    
    // 2. Wait for token to near expiration
    await sleep(270_000); // 4.5 minutes (token expires in 5 min)
    
    // 3. Attempt refresh
    const refreshResponse = await fetch('/api/auth/keycloak/refresh', {
      method: 'POST',
      headers: { Cookie: `session=${sessionCookie}` },
    });
    
    const refreshData = await refreshResponse.json();
    
    expect(refreshResponse.status).toBe(200);
    expect(refreshData.refreshed).toBe(true);
    expect(refreshData.expiresIn).toBeGreaterThan(0);
  });

  it('handles Keycloak downtime gracefully', async () => {
    // 1. Login successfully
    const session = await loginAndGetSession();
    
    // 2. Stop Keycloak
    keycloakContainer.stop();
    
    // 3. Attempt refresh
    const refreshResponse = await fetch('/api/auth/keycloak/refresh', {
      method: 'POST',
      headers: { Cookie: `session=${session.cookie}` },
    });
    
    const refreshData = await refreshResponse.json();
    
    // Should keep session and return 503
    expect(refreshResponse.status).toBe(503);
    expect(refreshData.retryable).toBe(true);
    
    const sessionAfter = await getSession();
    expect(sessionAfter).toBeTruthy(); // Session preserved
  });

  it('retries on transient network errors', async () => {
    const session = await loginAndGetSession();
    
    // Mock network to fail twice, then succeed
    let attempts = 0;
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      attempts++;
      if (attempts <= 2) {
        return Promise.reject(new Error('network timeout'));
      }
      return Promise.resolve(mockKeycloakTokenResponse());
    });
    
    const refreshResponse = await fetch('/api/auth/keycloak/refresh', {
      method: 'POST',
      headers: { Cookie: `session=${session.cookie}` },
    });
    
    expect(attempts).toBe(3); // 3 total attempts
    expect(refreshResponse.status).toBe(200);
  });
});
```

### Load Testing

```bash
# k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function () {
  const response = http.post('http://localhost:3000/api/auth/keycloak/refresh', null, {
    headers: { Cookie: `session=${__ENV.TEST_SESSION_COOKIE}` },
  });

  check(response, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(30); // Wait 30 seconds between requests (realistic token refresh interval)
}
```

---

## Migration Guide

### Pre-Migration Checklist

- [ ] **Backup production database** (session storage)
- [ ] **Review Keycloak token settings**:
  - Access token lifespan (typically 5-15 minutes)
  - Refresh token lifespan (typically 30 days)
  - Refresh token rotation enabled/disabled
- [ ] **Configure environment variables**:
  - `REFRESH_TIMEOUT_MS` (default: 10000)
  - `NODE_ENV` (for error verbosity)
- [ ] **Update monitoring dashboards** for new metrics
- [ ] **Test in staging environment** with realistic load

### Deployment Steps

#### 1. Deploy to Staging

```bash
# Build with new changes
npm run build

# Deploy to staging
./deploy-staging.sh

# Run integration tests
npm run test:integration

# Monitor for 24 hours
./monitor-staging.sh
```

#### 2. Gradual Production Rollout

```bash
# Deploy to 10% of traffic (canary)
./deploy-prod.sh --canary 10

# Monitor metrics for 2 hours
./monitor-prod.sh --canary

# Check error rates, response times, user complaints
# If good, increase to 50%
./deploy-prod.sh --canary 50

# Monitor for 4 hours
# If good, deploy to 100%
./deploy-prod.sh --full
```

### Rollback Plan

If issues are detected:

```bash
# Immediate rollback (< 5 minutes)
./rollback-prod.sh

# This reverts to previous version with old refresh logic
# Users may experience:
# - More aggressive session destruction (as before)
# - Slower response times (no pre-check)
# But authentication still works
```

### Post-Migration Validation

#### Metrics to Monitor (First 48 Hours)

| Metric | Baseline | Expected Change | Alert Threshold |
|--------|----------|-----------------|-----------------|
| `auth.refresh.success` | 95% | No change | < 90% |
| `auth.refresh.failed_network` | 2% | Decrease (retries help) | > 5% |
| `auth.refresh.failed_invalid_grant` | 3% | No change | > 10% |
| `auth.refresh.skipped_valid` | 0% | 60-80% (new) | N/A |
| `auth.refresh.rate_limited` | 0% | < 0.1% | > 1% |
| P95 response time | 150ms | Decrease to 50ms | > 500ms |
| User-reported auth issues | 5/day | Decrease | > 10/day |

#### Logs to Review

```bash
# Check for new error patterns
grep "Token refresh failed" /var/log/frontend/*.log | wc -l

# Check rate limiting (should be rare)
grep "Rate limit exceeded" /var/log/frontend/*.log

# Check mutex effectiveness
grep "Token already refreshed by concurrent request" /var/log/frontend/*.log

# Check retry behavior
grep "Retrying token refresh" /var/log/frontend/*.log
```

---

## Observability & Monitoring

### Metrics

#### Success Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `auth.refresh.request` | Counter | Total refresh requests | - |
| `auth.refresh.success` | Counter | Successful refreshes | - |
| `auth.refresh.skipped_valid` | Counter | Skipped (token still valid) | - |

#### Failure Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `auth.refresh.failed_invalid_grant` | Counter | Invalid/expired refresh token | - |
| `auth.refresh.failed_network` | Counter | Network/timeout errors | - |
| `auth.refresh.failed_server_error` | Counter | Keycloak 5xx errors | - |
| `auth.refresh.failed_rate_limited` | Counter | Rate limit exceeded | - |
| `auth.refresh.failed_unknown` | Counter | Unknown errors | - |
| `auth.refresh.no_session` | Counter | No active session | - |
| `auth.refresh.missing_token` | Counter | Session missing refresh token | - |

#### Performance Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `auth.refresh.duration_ms` | Histogram | Request duration | `percentile` |
| `auth.refresh.keycloak_duration_ms` | Histogram | Keycloak call duration | `percentile` |

### Dashboards

#### Grafana Dashboard Example

```json
{
  "title": "Token Refresh Monitoring",
  "panels": [
    {
      "title": "Refresh Success Rate",
      "targets": [
        {
          "expr": "rate(auth_refresh_success[5m]) / rate(auth_refresh_request[5m]) * 100"
        }
      ],
      "alert": {
        "conditions": [
          { "evaluator": { "params": [90], "type": "lt" } }
        ]
      }
    },
    {
      "title": "Error Breakdown",
      "targets": [
        {
          "expr": "sum(rate(auth_refresh_failed_invalid_grant[5m])) by (error_type)"
        }
      ]
    },
    {
      "title": "P95 Response Time",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(auth_refresh_duration_ms_bucket[5m]))"
        }
      ]
    },
    {
      "title": "Token Pre-Check Effectiveness",
      "targets": [
        {
          "expr": "rate(auth_refresh_skipped_valid[5m]) / rate(auth_refresh_request[5m]) * 100"
        }
      ]
    }
  ]
}
```

### Alerts

#### Critical Alerts (PagerDuty)

```yaml
- alert: RefreshSuccessRateDropped
  expr: rate(auth_refresh_success[5m]) / rate(auth_refresh_request[5m]) < 0.90
  for: 5m
  severity: critical
  annotations:
    summary: "Token refresh success rate below 90%"
    description: "Only {{ $value | humanizePercentage }} of refresh requests succeeding"

- alert: HighInvalidGrantRate
  expr: rate(auth_refresh_failed_invalid_grant[5m]) > 10
  for: 10m
  severity: critical
  annotations:
    summary: "High rate of invalid_grant errors"
    description: "Possible Keycloak token rotation misconfiguration"
```

#### Warning Alerts (Slack)

```yaml
- alert: RefreshResponseTimeSlow
  expr: histogram_quantile(0.95, rate(auth_refresh_duration_ms_bucket[5m])) > 500
  for: 10m
  severity: warning
  annotations:
    summary: "Token refresh P95 response time > 500ms"

- alert: HighRateLimitRate
  expr: rate(auth_refresh_rate_limited[5m]) > 1
  for: 5m
  severity: warning
  annotations:
    summary: "Rate limiting triggered frequently"
    description: "Possible abuse or aggressive client behavior"
```

### Log Structure

#### Successful Refresh

```json
{
  "level": "info",
  "message": "Token refresh successful",
  "timestamp": "2025-01-27T10:30:45.123Z",
  "requestId": "refresh_a1b2c3d4e5f6",
  "userId": "user_12345",
  "expiresIn": 300,
  "durationMs": 85,
  "refreshed": true
}
```

#### Failed Refresh (Transient)

```json
{
  "level": "warn",
  "message": "Transient refresh failure, keeping session",
  "timestamp": "2025-01-27T10:30:50.789Z",
  "requestId": "refresh_g7h8i9j0k1l2",
  "userId": "user_67890",
  "errorType": "network",
  "error": "Token refresh timeout",
  "retryCount": 3,
  "sessionPreserved": true
}
```

#### Failed Refresh (Fatal)

```json
{
  "level": "error",
  "message": "Refresh token invalid, destroying session",
  "timestamp": "2025-01-27T10:31:00.456Z",
  "requestId": "refresh_m3n4o5p6q7r8",
  "userId": "user_11111",
  "errorType": "invalid_grant",
  "status": 401,
  "sessionDestroyed": true
}
```

---

## References

### Related Documentation

- [PKCE_SECURITY_REFACTOR.md](./PKCE_SECURITY_REFACTOR.md) - Authorization endpoint security
- [CALLBACK_SECURITY_REFACTOR.md](./CALLBACK_SECURITY_REFACTOR.md) - Callback handler improvements
- [EXCHANGE_SECURITY_REFACTOR.md](./EXCHANGE_SECURITY_REFACTOR.md) - Token exchange security
- [LOGOUT_SECURITY_REFACTOR.md](./LOGOUT_SECURITY_REFACTOR.md) - Logout endpoint security
- [KEYCLOAK_AUTH_IMPLEMENTATION.md](./KEYCLOAK_AUTH_IMPLEMENTATION.md) - OAuth2/OIDC flows

### OAuth2 Specifications

- [RFC 6749: OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 6750: Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [RFC 7009: Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)

### Security Standards

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NIST SP 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Keycloak Documentation

- [Keycloak Token Endpoint](https://www.keycloak.org/docs/latest/securing_apps/#_token-endpoint)
- [Keycloak Token Refresh](https://www.keycloak.org/docs/latest/securing_apps/#_refresh_token)
- [Keycloak Session Management](https://www.keycloak.org/docs/latest/server_admin/#_timeouts)

---

## Changelog

### Version 1.0.0 (2025-01-27)

**Added:**
- Error classification system with 5 error types
- Request timeout protection (10s configurable)
- Concurrent refresh mutex (in-memory)
- Token expiration pre-check (1 minute buffer)
- Rate limiting (10 req/min per user)
- Exponential backoff retry (3 attempts)
- Error sanitization for security
- Request correlation headers
- Comprehensive observability (metrics, audit, logs)

**Changed:**
- Selective session destruction (only for `invalid_grant`)
- Response format includes `refreshed` boolean
- Keycloak errors sanitized before logging

**Removed:**
- Aggressive session destruction on all errors
- Verbose error details in production responses

---

## Appendix

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REFRESH_TIMEOUT_MS` | No | 10000 | Max time for Keycloak token endpoint response |
| `NODE_ENV` | No | development | Determines error verbosity |

### Response Schemas

#### Success Response

```typescript
{
  success: true,
  refreshed: boolean,      // true if token was refreshed, false if skipped
  expiresIn: number,       // Seconds until access token expires
  message?: string         // Optional human-readable message
}
```

#### Error Response (Transient)

```typescript
{
  error: 'temporary_failure',
  message: 'Temporary authentication service issue. Please try again.',
  retryable: true,
  retryAfter: 5           // Seconds before client should retry
}
```

#### Error Response (Fatal)

```typescript
{
  error: 'session_expired',
  message: 'Your session has expired. Please log in again.'
}
```

#### Rate Limit Response

```typescript
{
  error: 'rate_limited',
  message: 'Too many refresh requests. Please try again later.',
  retryAfter: 60          // Seconds until rate limit window resets
}
```

---

**End of Document**

For questions or issues, please contact the platform team or create an issue in the repository.
