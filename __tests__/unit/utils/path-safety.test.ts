import {
  validateId,
  validateSlug,
  validateHandle,
  validateSlugOrId,
  validateAlphanumeric,
  PathSegmentError,
} from '@/shared/utils/path-safety';

describe('Path Safety Validators', () => {
  describe('Dangerous Character Blockers', () => {
    const dangerousInputs = [
      '../etc/passwd',
      'foo/bar',
      'foo%2fbar',
      'foo%2Fbar',
      'foo%00bar',
      '<script>alert(1)</script>',
      'something"with\'quotes',
      'a'.repeat(301),
    ];

    it('should throw PathSegmentError for dangerous inputs', () => {
      for (const input of dangerousInputs) {
        expect(() => validateId(input)).toThrow(PathSegmentError);
        expect(() => validateSlug(input)).toThrow(PathSegmentError);
        expect(() => validateHandle(input)).toThrow(PathSegmentError);
        expect(() => validateSlugOrId(input)).toThrow(PathSegmentError);
        expect(() => validateAlphanumeric(input)).toThrow(PathSegmentError);
      }
    });
  });

  describe('validateId', () => {
    it('accepts valid numeric IDs', () => {
      expect(validateId('123')).toBe('123');
      expect(validateId(9999)).toBe('9999');
    });

    it('accepts valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateId(uuid)).toBe(uuid);
    });

    it('rejects non-numeric, non-UUID formats', () => {
      expect(() => validateId('abc')).toThrow(PathSegmentError);
      expect(() => validateId('123-abc')).toThrow(PathSegmentError);
    });
  });

  describe('validateSlug', () => {
    it('accepts valid slugs', () => {
      expect(validateSlug('my-product-slug')).toBe('my-product-slug');
      expect(validateSlug('simple123')).toBe('simple123');
    });

    it('rejects slugs with uppercase letters, slashes, or special characters', () => {
      expect(() => validateSlug('My-Product-Slug')).toThrow(PathSegmentError);
      expect(() => validateSlug('my_product_slug')).toThrow(PathSegmentError);
      expect(() => validateSlug('my-product-slug!')).toThrow(PathSegmentError);
    });

    it('rejects slugs exceeding length limits', () => {
      expect(() => validateSlug('a'.repeat(201))).toThrow(PathSegmentError);
    });
  });

  describe('validateHandle', () => {
    it('accepts valid seller handles', () => {
      expect(validateHandle('super-seller_1')).toBe('super-seller_1');
      expect(validateHandle('xyz')).toBe('xyz');
    });

    it('rejects invalid handles', () => {
      expect(() => validateHandle('ab')).toThrow(PathSegmentError); // too short
      expect(() => validateHandle('a'.repeat(51))).toThrow(PathSegmentError); // too long
      expect(() => validateHandle('seller!')).toThrow(PathSegmentError);
    });
  });

  describe('validateSlugOrId', () => {
    it('accepts slugs, numeric IDs, or UUIDs', () => {
      expect(validateSlugOrId('123')).toBe('123');
      expect(validateSlugOrId('my-slug')).toBe('my-slug');
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateSlugOrId(uuid)).toBe(uuid);
    });

    it('rejects other formats', () => {
      expect(() => validateSlugOrId('invalid_slug_or_id!')).toThrow(PathSegmentError);
    });
  });

  describe('validateAlphanumeric', () => {
    it('accepts valid alphanumeric strings', () => {
      expect(validateAlphanumeric('ABC123xyz')).toBe('ABC123xyz');
    });

    it('rejects symbols or spaces', () => {
      expect(() => validateAlphanumeric('abc-123')).toThrow(PathSegmentError);
      expect(() => validateAlphanumeric('abc 123')).toThrow(PathSegmentError);
    });
  });
});
