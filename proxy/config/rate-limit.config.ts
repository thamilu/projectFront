export interface RateLimitRule {
  prefix: string;
  requests: number;
  window: string;
  identifier: 'ip' | 'ip+path';
}

export const RATE_LIMIT_RULES: readonly RateLimitRule[] = [
  { prefix: '/seller/register', requests: 10, window: '10 s', identifier: 'ip' },
  { prefix: '/api/auth', requests: 10, window: '60 s', identifier: 'ip+path' },
  { prefix: '/api/', requests: 200, window: '60 s', identifier: 'ip' },
] as const;
