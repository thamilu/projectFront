# API Runtime Configuration Migration Guide

## Why We Changed

To align the application configuration with enterprise-grade and 12-Factor App standards, the direct usage of the flat `API_RUNTIME_CONFIG` constant has been replaced by a lazy, validated singleton resolver `getApiRuntimeConfig()`.

This resolves the following issues:

1. **No Hardcoded Fallbacks**: Safe default values are limited strictly to local development. Production/Staging deployments will now fail fast during build and boot time if `NEXT_PUBLIC_API_URL` is missing or misconfigured.
2. **Environment Isolation**: Proper validation of the `NEXT_PUBLIC_APP_ENV` environment variable ensures the correct API timeout (10s in production, 15s in staging, 30s in development) and config boundaries are enforced.
3. **Format Validation**: Absolute URL and version checks are run immediately, preventing runtime silent failures due to malformed path resolution.
4. **Improved Testing**: Module side-effects have been eliminated by caching inside a lazy resolver, allowing unit tests to clean environment configuration state via `_resetApiRuntimeConfig()`.

---

## Migration Table

| Deprecated (Remove by Sprint 12) | Modern Lazy API                 |
| -------------------------------- | ------------------------------- |
| `API_RUNTIME_CONFIG`             | `getApiRuntimeConfig()`         |
| `API_RUNTIME_CONFIG.baseUrl`     | `getApiRuntimeConfig().baseUrl` |
| `API_RUNTIME_CONFIG.version`     | `getApiRuntimeConfig().version` |
| `API_RUNTIME_CONFIG.timeout`     | `getApiRuntimeConfig().timeout` |

---

## Code Transition Examples

### Before

```typescript
import { API_RUNTIME_CONFIG } from '@/shared/config/api-runtime.config';

const v = (path: string): ApiPath => {
  const version = API_RUNTIME_CONFIG.version;
  return `/api/${version}${path}` as ApiPath;
};
```

### After

```typescript
import { getApiRuntimeConfig } from '@/shared/config';

const v = (path: string): ApiPath => {
  const version = getApiRuntimeConfig().version;
  return `/api/${version}${path}` as ApiPath;
};
```

---

## Testing Environment Settings in Jest

To mock different environments during unit tests, call `_resetApiRuntimeConfig()` to clear the cache:

```typescript
import { getApiRuntimeConfig, _resetApiRuntimeConfig } from '@/shared/config';

describe('API config testing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    _resetApiRuntimeConfig();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('runs staging checks', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    process.env.NEXT_PUBLIC_API_URL = 'https://api-staging.example.com';
    const config = getApiRuntimeConfig();
    expect(config.baseUrl).toBe('https://api-staging.example.com');
  });
});
```
