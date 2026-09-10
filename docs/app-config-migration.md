# Application Configuration Migration Guide

This document guides developers through migrating from the eager constant `APP_CONFIG` to the lazy singleton configuration resolver `getAppConfig()`.

## Why Refactor?

The legacy configuration model resolved parameters eagerly at module import time, bypassing schema validation and leading to bugs with falsey values (e.g. `||` falling back on empty strings instead of using `??`).

The refactored module implements:

1. **Zod Validation at startup**: All configuration variables are validated against schemas at application boot.
2. **Lazy Initialization**: Config is resolved on first call, then cached and frozen.
3. **Strict Domain-Specific Validation**:
   - Currency codes are normalized and checked against ISO 4217 pattern.
   - Currency symbols are validated for display length bounds.
   - BCP 47 locales are normalized and verified against the local browser/node `Intl` engine capabilities.
   - Page sizes are validated for integer formats, minimum/maximum bounds, and relational sanity.

---

## Migration Steps

### 1. Consuming Config in Code

Instead of reading properties off `APP_CONFIG` directly, import and call `getAppConfig()`:

```typescript
// ❌ Old
import { APP_CONFIG } from '@/shared/config/app-config';
const currency = APP_CONFIG.defaultCurrency;

// ✅ New
import { getAppConfig } from '@/shared/config';
const currency = getAppConfig().defaultCurrency;
```

For constants that need static configurations (e.g., domain modules), use lazy getters to prevent eager import evaluation:

```typescript
// ❌ Old
export const PRICE_RANGE = {
  CURRENCY: APP_CONFIG.defaultCurrency,
} as const;

// ✅ New
export const PRICE_RANGE = {
  get CURRENCY(): string {
    return getAppConfig().defaultCurrency;
  },
} as const;
```

---

## Zod Schema vs Semantic Validation

- **Zod Schema (`env.ts`)**: Owns format, types, pattern checks, integer coercions, and basic boundary validations (`min`, `max`, `regex`).
- **Semantic Validation (`app-config.ts`)**: Owns relational bounds checks (e.g., `defaultPageSize <= maxPageSize`), locale compatibility checks (via the `Intl` API), and runtime transformations (such as BCP 47 locale casing normalizations).

---

## Environment Variables Reference

Add these to your local `.env.local` file:

```ini
# ISO 4217 three-letter currency code. Default: INR
NEXT_PUBLIC_DEFAULT_CURRENCY=INR

# Display symbol for the default currency. Max 5 characters. Default: ₹
NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL=₹

# BCP 47 locale code for number/date formatting. Default: en-IN
NEXT_PUBLIC_DEFAULT_LOCALE=en-IN

# Default items per page. Default: 20
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20

# Max items per page. Default: 100
NEXT_PUBLIC_MAX_PAGE_SIZE=100
```

---

## Unit Testing & Isolation

To prevent test cross-contamination, use Jest module mocking for `@/env`. Never check or fall back on `process.env` directly in production code.

Example test setup:

```typescript
import { env } from '@/env';
import { getAppConfig, _resetAppConfig } from '@/shared/config/app-config';

// 1. Mock the environment variables module
jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DEFAULT_CURRENCY: 'INR',
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '₹',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'en-IN',
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 20,
    NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    NEXT_PUBLIC_APP_NAME: 'App',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
}));

describe('getAppConfig', () => {
  beforeEach(() => {
    // 2. Clear cached lazy config singleton between tests
    _resetAppConfig();
  });

  it('reflects customized environment variables', () => {
    // 3. Mutate mocked values dynamically in tests
    (env as any).NEXT_PUBLIC_DEFAULT_CURRENCY = 'USD';
    (env as any).NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL = '$';

    const config = getAppConfig();
    expect(config.defaultCurrency).toBe('USD');
    expect(config.defaultCurrencySymbol).toBe('$');
  });
});
```
