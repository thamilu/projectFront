import {
  resolveApiEnvironment,
  getApiRuntimeConfig,
  _resetApiRuntimeConfig,
  validateBaseUrl,
  validateApiVersion,
  validateTimeout,
} from '@/shared/config/api-runtime.config';

describe('API Runtime Configuration - resolveApiEnvironment', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_ENV;

  beforeEach(() => {
    _resetApiRuntimeConfig();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = originalEnv;
    }
  });

  it('returns "development" when NEXT_PUBLIC_APP_ENV is not set or empty', () => {
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(resolveApiEnvironment()).toBe('development');

    process.env.NEXT_PUBLIC_APP_ENV = '';
    expect(resolveApiEnvironment()).toBe('development');

    process.env.NEXT_PUBLIC_APP_ENV = '   ';
    expect(resolveApiEnvironment()).toBe('development');
  });

  it('resolves correct environment keys case-insensitively with trimming', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    expect(resolveApiEnvironment()).toBe('staging');

    process.env.NEXT_PUBLIC_APP_ENV = '  staging  ';
    expect(resolveApiEnvironment()).toBe('staging');

    process.env.NEXT_PUBLIC_APP_ENV = 'STAGING';
    expect(resolveApiEnvironment()).toBe('staging');

    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    expect(resolveApiEnvironment()).toBe('production');

    process.env.NEXT_PUBLIC_APP_ENV = '  PRODUCTION  ';
    expect(resolveApiEnvironment()).toBe('production');
  });

  it('throws a descriptive error on invalid or unrecognized environment values', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'uat';
    expect(() => resolveApiEnvironment()).toThrow('Invalid NEXT_PUBLIC_APP_ENV value: "uat"');

    process.env.NEXT_PUBLIC_APP_ENV = 'prod';
    expect(() => resolveApiEnvironment()).toThrow('Invalid NEXT_PUBLIC_APP_ENV value: "prod"');

    process.env.NEXT_PUBLIC_APP_ENV = 'dev';
    expect(() => resolveApiEnvironment()).toThrow('Invalid NEXT_PUBLIC_APP_ENV value: "dev"');
  });
});

describe('API Runtime Configuration - validateBaseUrl', () => {
  it('accepts correct absolute URLs', () => {
    expect(validateBaseUrl('https://api.example.com', 'test')).toBe('https://api.example.com');
    expect(validateBaseUrl('http://localhost:8082', 'test')).toBe('http://localhost:8082');
    expect(validateBaseUrl('https://api.example.com/internal', 'test')).toBe(
      'https://api.example.com/internal'
    );
  });

  it('normalizes trailing slashes', () => {
    expect(validateBaseUrl('https://api.example.com/', 'test')).toBe('https://api.example.com');
    expect(validateBaseUrl('https://api.example.com//', 'test')).toBe('https://api.example.com');
    expect(validateBaseUrl('https://api.example.com/api/v1/', 'test')).toBe(
      'https://api.example.com/api/v1'
    );
  });

  it('throws on invalid URL formats', () => {
    expect(() => validateBaseUrl('not-a-url', 'test')).toThrow('Invalid URL format');
    expect(() => validateBaseUrl('', 'test')).toThrow('Invalid URL format');
  });

  it('throws on insecure or invalid protocols', () => {
    expect(() => validateBaseUrl('ftp://api.example.com', 'test')).toThrow(
      'Invalid protocol for "test" environment'
    );
    expect(() => validateBaseUrl('ws://api.example.com', 'test')).toThrow(
      'Invalid protocol for "test" environment'
    );
  });
});

describe('API Runtime Configuration - validateApiVersion', () => {
  it('accepts valid version shapes and normalizes them', () => {
    expect(validateApiVersion('v1', 'test')).toBe('v1');
    expect(validateApiVersion('V1', 'test')).toBe('v1');
    expect(validateApiVersion('v10', 'test')).toBe('v10');
    expect(validateApiVersion('  v2  ', 'test')).toBe('v2');
  });

  it('throws on invalid version shapes', () => {
    expect(() => validateApiVersion('v1.0', 'test')).toThrow('Invalid API version');
    expect(() => validateApiVersion('v1-beta', 'test')).toThrow('Invalid API version');
    expect(() => validateApiVersion('version1', 'test')).toThrow('Invalid API version');
    expect(() => validateApiVersion('', 'test')).toThrow('Invalid API version');
  });
});

describe('API Runtime Configuration - validateTimeout', () => {
  it('accepts correct bounds', () => {
    expect(validateTimeout(1000, 'test')).toBe(1000);
    expect(validateTimeout(30000, 'test')).toBe(30000);
    expect(validateTimeout(60000, 'test')).toBe(60000);
  });

  it('throws on out-of-bounds timeouts', () => {
    expect(() => validateTimeout(500, 'test')).toThrow('Invalid timeout for "test" environment');
    expect(() => validateTimeout(65000, 'test')).toThrow('Invalid timeout for "test" environment');
    expect(() => validateTimeout(-1000, 'test')).toThrow('Invalid timeout for "test" environment');
  });

  it('throws on non-integer timeouts', () => {
    expect(() => validateTimeout(1500.5, 'test')).toThrow('Invalid timeout for "test" environment');
  });
});

describe('API Runtime Configuration - getApiRuntimeConfig singleton resolver', () => {
  const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    _resetApiRuntimeConfig();
  });

  afterEach(() => {
    if (originalAppEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
    }
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('returns the same cached config instance reference on multiple calls', () => {
    const config1 = getApiRuntimeConfig();
    const config2 = getApiRuntimeConfig();
    expect(config1).toBe(config2);
  });

  it('returns a frozen immutable configuration object', () => {
    const config = getApiRuntimeConfig();
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      (config as any).baseUrl = 'http://mutation-attempt.com';
    }).toThrow(TypeError);
  });

  it('fails fast on missing or malformed production environments', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = '';

    expect(() => getApiRuntimeConfig()).toThrow('Missing required environment variable');
  });

  it('throws error when resetting outside of tests', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    expect(() => _resetApiRuntimeConfig()).toThrow('only available in test environments');

    (process.env as any).NODE_ENV = originalNodeEnv;
  });
});
