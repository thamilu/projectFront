import {
  getAppConfig,
  resolveAppConfig,
  _resetAppConfig,
  validateCurrencyCode,
  validateCurrencySymbol,
  validateLocale,
  validatePageSize,
} from '@/shared/config/app-config';
import { PRICE_RANGE } from '@/shared/constants/domain/product';

// Define the baseline mock environment variables
const baselineMockEnv = {
  NEXT_PUBLIC_DEFAULT_CURRENCY: 'INR',
  NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '₹',
  NEXT_PUBLIC_DEFAULT_LOCALE: 'en-IN',
  NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 20,
  NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
  NEXT_PUBLIC_APP_NAME: 'App',
  NEXT_PUBLIC_APP_VERSION: '1.0.0',
};

// Mock the environment variables module using a global store inside the hoisted factory
jest.mock('@/env', () => {
  (global as any).mockEnvValues = {
    NEXT_PUBLIC_DEFAULT_CURRENCY: 'INR',
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '₹',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'en-IN',
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 20,
    NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    NEXT_PUBLIC_APP_NAME: 'App',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  };
  return {
    env: new Proxy(
      {},
      {
        get: (_target, prop) => (global as any).mockEnvValues[prop],
        set: (_target, prop, value) => {
          (global as any).mockEnvValues[prop] = value;
          return true;
        },
      }
    ),
  };
});

// Test helper: Set dynamic mock environment configurations
const setMockEnv = (overrides: Partial<typeof baselineMockEnv>): void => {
  Object.assign((global as any).mockEnvValues, overrides);
};

// Test helper: Restore environment to baseline configs
const resetMockEnv = (): void => {
  // Clear all properties to handle undefined test states
  for (const key of Object.keys((global as any).mockEnvValues)) {
    delete (global as any).mockEnvValues[key];
  }
  Object.assign((global as any).mockEnvValues, baselineMockEnv);
};

// DRY helper assertions
const assertInvalidCurrencyCode = (value: any): void => {
  expect(() => validateCurrencyCode(value, 'test')).toThrow();
};

const assertInvalidCurrencySymbol = (value: any): void => {
  expect(() => validateCurrencySymbol(value, 'test')).toThrow();
};

const assertInvalidLocale = (value: any): void => {
  expect(() => validateLocale(value, 'test')).toThrow();
};

const assertInvalidPageSize = (value: any, max = 100): void => {
  expect(() => validatePageSize(value, 'test', max)).toThrow();
};

describe('App Config — Currency Code Validation', () => {
  it('accepts and normalizes valid ISO 4217 currency codes', () => {
    expect(validateCurrencyCode('USD', 'test')).toBe('USD');
    expect(validateCurrencyCode('inr', 'test')).toBe('INR');
    expect(validateCurrencyCode('  eur  ', 'test')).toBe('EUR');
  });

  it('throws on invalid currency code formats', () => {
    assertInvalidCurrencyCode('IN');
    assertInvalidCurrencyCode('INRR');
    assertInvalidCurrencyCode('123');
  });

  it('throws on empty currency codes', () => {
    assertInvalidCurrencyCode('');
    assertInvalidCurrencyCode('   ');
  });

  it('throws on null and undefined currency codes', () => {
    assertInvalidCurrencyCode(null);
    assertInvalidCurrencyCode(undefined);
  });
});

describe('App Config — Currency Symbol Validation', () => {
  it('accepts and trims valid symbols', () => {
    expect(validateCurrencySymbol('₹', 'test')).toBe('₹');
    expect(validateCurrencySymbol('$', 'test')).toBe('$');
    expect(validateCurrencySymbol('  €  ', 'test')).toBe('€');
  });

  it('accepts multi-byte unicode and rial symbols', () => {
    expect(validateCurrencySymbol('﷼', 'test')).toBe('﷼');
  });

  it('throws if symbol length exceeds bounds', () => {
    assertInvalidCurrencySymbol('USDOLLAR');
    assertInvalidCurrencySymbol('USD  $');
  });

  it('throws on empty symbols', () => {
    assertInvalidCurrencySymbol('');
    assertInvalidCurrencySymbol('   ');
  });

  it('throws on null and undefined currency symbols', () => {
    assertInvalidCurrencySymbol(null);
    assertInvalidCurrencySymbol(undefined);
  });

  it('throws on control characters and null bytes (Security Fuzz check)', () => {
    assertInvalidCurrencySymbol('\u0000');
    assertInvalidCurrencySymbol('$\u0007');
  });
});

describe('App Config — Locale Validation', () => {
  it('accepts and normalizes valid BCP 47 locale codes', () => {
    expect(validateLocale('en-IN', 'test')).toBe('en-IN');
    expect(validateLocale('en', 'test')).toBe('en');
    expect(validateLocale('  en-in  ', 'test')).toBe('en-IN');
    expect(validateLocale('EN-IN', 'test')).toBe('en-IN');
  });

  it('throws on invalid locale code formats', () => {
    assertInvalidLocale('en-US-extended');
    assertInvalidLocale('12-34');
  });

  it('throws on unsupported language tags (Intl API rejection)', () => {
    assertInvalidLocale('xx-XX');
  });

  it('throws on null and undefined locale values', () => {
    assertInvalidLocale(null);
    assertInvalidLocale(undefined);
  });
});

describe('App Config — Page Size Validation', () => {
  it('accepts integers within valid boundaries', () => {
    expect(validatePageSize(20, 'test', 100)).toBe(20);
    expect(validatePageSize(1, 'test', 100)).toBe(1);
    expect(validatePageSize(100, 'test', 100)).toBe(100);
  });

  it('throws on out-of-bounds page sizes', () => {
    assertInvalidPageSize(0);
    assertInvalidPageSize(101);
    assertInvalidPageSize(-10);
  });

  it('throws on non-integer values', () => {
    assertInvalidPageSize(20.5);
  });

  it('throws on null, undefined, NaN, and Infinity values', () => {
    assertInvalidPageSize(null);
    assertInvalidPageSize(undefined);
    assertInvalidPageSize(NaN);
    assertInvalidPageSize(Infinity);
  });
});

describe('App Config — resolveAppConfig Dependency Inversion pure factory', () => {
  it('resolves valid parameters directly without cache mutation', () => {
    const config = resolveAppConfig({
      NEXT_PUBLIC_DEFAULT_CURRENCY: 'USD',
      NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '$',
      NEXT_PUBLIC_DEFAULT_LOCALE: 'en-US',
      NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 50,
      NEXT_PUBLIC_MAX_PAGE_SIZE: 150,
      NEXT_PUBLIC_APP_NAME: 'Dynamic Shop',
      NEXT_PUBLIC_APP_VERSION: '2.0.0',
    });

    expect(config.defaultCurrency).toBe('USD');
    expect(config.defaultCurrencySymbol).toBe('$');
    expect(config.defaultLocale).toBe('en-US');
    expect(config.defaultPageSize).toBe(50);
    expect(config.maxPageSize).toBe(150);
    expect(config.appName).toBe('Dynamic Shop');
    expect(config.appVersion).toBe('2.0.0');
  });

  it('utilizes default fallback configurations when environment variables are undefined or null', () => {
    const config = resolveAppConfig({});
    expect(config.defaultCurrency).toBe('INR');
    expect(config.defaultCurrencySymbol).toBe('₹');
    expect(config.defaultLocale).toBe('en-IN');
    expect(config.defaultPageSize).toBe(20);
    expect(config.maxPageSize).toBe(100);
  });
});

describe('App Config — Lazy Singleton Resolver', () => {
  beforeEach(() => {
    _resetAppConfig();
    resetMockEnv();
  });

  it('returns the same frozen config instance on successive calls', () => {
    const config1 = getAppConfig();
    const config2 = getAppConfig();
    expect(config1).toBe(config2);
    expect(Object.isFrozen(config1)).toBe(true);
  });

  it('throws TypeError if modifications are attempted in strict mode', () => {
    const config = getAppConfig();
    expect(() => {
      (config as any).defaultCurrency = 'EUR';
    }).toThrow(TypeError);
  });

  it('allows config renewal after calling reset utility', () => {
    setMockEnv({ NEXT_PUBLIC_DEFAULT_CURRENCY: 'INR' });
    const config1 = getAppConfig();
    expect(config1.defaultCurrency).toBe('INR');

    _resetAppConfig();

    setMockEnv({
      NEXT_PUBLIC_DEFAULT_CURRENCY: 'USD',
      NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '$',
    });
    const config2 = getAppConfig();
    expect(config2.defaultCurrency).toBe('USD');
    expect(config2.defaultCurrencySymbol).toBe('$');
  });

  it('throws if defaultPageSize exceeds maxPageSize', () => {
    setMockEnv({
      NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 150,
      NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    });
    expect(() => getAppConfig()).toThrow('cannot be greater than maxPageSize');
  });

  it('allows defaultPageSize to equal maxPageSize', () => {
    setMockEnv({
      NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 100,
      NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    });
    expect(getAppConfig().defaultPageSize).toBe(100);
  });

  it('throws error when resetting outside of test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    expect(() => _resetAppConfig()).toThrow('only available in test environments');

    (process.env as any).NODE_ENV = originalNodeEnv;
  });
});

describe('App Config — product.ts Constants Integration', () => {
  beforeEach(() => {
    _resetAppConfig();
    resetMockEnv();
  });

  it('correctly maps to getAppConfig() values dynamically', () => {
    setMockEnv({
      NEXT_PUBLIC_DEFAULT_CURRENCY: 'USD',
      NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '$',
    });

    expect(PRICE_RANGE.CURRENCY).toBe('USD');
    expect(PRICE_RANGE.CURRENCY_SYMBOL).toBe('$');

    _resetAppConfig();

    setMockEnv({
      NEXT_PUBLIC_DEFAULT_CURRENCY: 'EUR',
      NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '€',
    });

    expect(PRICE_RANGE.CURRENCY).toBe('EUR');
    expect(PRICE_RANGE.CURRENCY_SYMBOL).toBe('€');
  });
});
