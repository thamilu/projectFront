/**
 * Shop handle rules.
 *
 * The critical property under test is the one that caused the production
 * console error: everything `describeShopHandleViolation` accepts must also be
 * accepted by `validateHandle`, the path-safety guard that
 * `API_ENDPOINTS.SELLER.CHECK_HANDLE()` runs and that **throws** on rejection.
 * If those two ever diverge again, the availability check starts throwing
 * synchronously into a `catch` block that expects HTTP errors.
 */

import {
  SHOP_HANDLE_MAX_LENGTH,
  SHOP_HANDLE_MESSAGES,
  SHOP_HANDLE_MIN_LENGTH,
  describeShopHandleViolation,
  generateShopHandle,
  isValidShopHandle,
} from '@/domains/seller/contracts/shop-handle';
import { validateHandle } from '@/shared/utils/path-safety';
import { sellerOnboardingSchema } from '@/domains/seller/contracts/seller.schema';

describe('describeShopHandleViolation', () => {
  it('accepts a well-formed handle', () => {
    expect(describeShopHandleViolation('acme-store')).toBeNull();
    expect(describeShopHandleViolation('shop123')).toBeNull();
    expect(isValidShopHandle('a-1')).toBe(true);
  });

  it('names the specific rule that was broken rather than failing generically', () => {
    // The whole point of returning a reason: "Handle verification failed" told
    // a seller nothing they could act on.
    expect(describeShopHandleViolation('ab')).toBe(SHOP_HANDLE_MESSAGES.tooShort);
    expect(describeShopHandleViolation('a'.repeat(SHOP_HANDLE_MAX_LENGTH + 1))).toBe(
      SHOP_HANDLE_MESSAGES.tooLong
    );
    expect(describeShopHandleViolation('My_Shop')).toBe(SHOP_HANDLE_MESSAGES.invalidCharacters);
    expect(describeShopHandleViolation('my.shop')).toBe(SHOP_HANDLE_MESSAGES.invalidCharacters);
    expect(describeShopHandleViolation('my shop')).toBe(SHOP_HANDLE_MESSAGES.invalidCharacters);
  });

  it('reports length before format, so an over-long handle is not blamed on characters', () => {
    expect(describeShopHandleViolation('a'.repeat(60))).toBe(SHOP_HANDLE_MESSAGES.tooLong);
  });
});

describe('compatibility with the URL path guard', () => {
  const accepted = [
    'abc',
    'acme-store',
    'shop123',
    '1-2-3',
    'a'.repeat(SHOP_HANDLE_MIN_LENGTH),
    'a'.repeat(SHOP_HANDLE_MAX_LENGTH),
  ];

  it.each(accepted)('validateHandle does not throw for the accepted handle %p', (handle) => {
    expect(isValidShopHandle(handle)).toBe(true);
    expect(() => validateHandle(handle)).not.toThrow();
  });

  it('rejects everything validateHandle would throw on', () => {
    // The reverse direction is what matters: validateHandle is *looser*
    // (`[a-zA-Z0-9_-]`), so anything it throws on must already be caught here,
    // before a URL is ever built.
    const throwers = ['ab', '', 'my.shop', 'my shop', 'a'.repeat(51), '../etc', 'a<b>c'];

    for (const handle of throwers) {
      expect(() => validateHandle(handle)).toThrow();
      expect(isValidShopHandle(handle)).toBe(false);
    }
  });
});

describe('generateShopHandle', () => {
  it('slugifies a store name', () => {
    expect(generateShopHandle('Acme Store')).toBe('acme-store');
    expect(generateShopHandle("Raj's Organic Farm!!")).toBe('raj-s-organic-farm');
  });

  it('caps the result at the schema maximum', () => {
    // Regression: the inline version had no cap, so a long store name produced
    // a handle that failed `max(50)` validation and crashed the availability
    // check — with the seller having typed nothing wrong.
    const generated = generateShopHandle('The Extraordinarily Long Name Of A Very Ambitious Store Company Limited');

    expect(generated.length).toBeLessThanOrEqual(SHOP_HANDLE_MAX_LENGTH);
    expect(isValidShopHandle(generated)).toBe(true);
  });

  it('never leaves a trailing hyphen after truncation', () => {
    // Slicing at 50 can land immediately after a word boundary.
    const generated = generateShopHandle('a'.repeat(49) + ' bcd');

    expect(generated.endsWith('-')).toBe(false);
    expect(isValidShopHandle(generated)).toBe(true);
  });

  it('returns empty rather than an unusable fragment', () => {
    expect(generateShopHandle('!!')).toBe('');
    expect(generateShopHandle('ab')).toBe('');
    expect(generateShopHandle('   ')).toBe('');
  });

  it('only ever produces handles the schema accepts', () => {
    const names = [
      'Acme Store',
      'शॉप 24',
      '   spaced   out   ',
      'UPPER CASE NAME',
      'a'.repeat(200),
      'store---with---dashes',
    ];

    for (const name of names) {
      const generated = generateShopHandle(name);
      if (generated === '') continue;

      const parsed = sellerOnboardingSchema.safeParse({ shopHandle: generated });
      const handleIssue = parsed.success
        ? undefined
        : parsed.error.issues.find((issue) => issue.path[0] === 'shopHandle');

      expect({ name, generated, handleIssue: handleIssue?.message }).toEqual({
        name,
        generated,
        handleIssue: undefined,
      });
    }
  });
});
