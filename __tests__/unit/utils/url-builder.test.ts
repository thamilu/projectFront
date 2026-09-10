import { buildQueryString, buildSearchUrl } from '@/shared/utils/url-builder';

describe('URL Builder Utilities', () => {
  describe('buildQueryString', () => {
    it('constructs correct query string from flat parameters', () => {
      const params = {
        q: 'search query',
        page: 2,
        inStock: true,
        empty: '',
        nil: null,
        undef: undefined,
      };

      expect(buildQueryString(params)).toBe('?q=search+query&page=2&inStock=true');
    });

    it('returns empty string when all values are nil or empty', () => {
      const params = {
        empty: '',
        nil: null,
        undef: undefined,
      };

      expect(buildQueryString(params)).toBe('');
    });
  });

  describe('buildSearchUrl', () => {
    it('appends formatted query params to the endpoint', () => {
      const params = {
        q: 'cricket bat',
        minPrice: 500,
        maxPrice: 2000,
        rating: 4 as const,
      };

      expect(buildSearchUrl('/api/v1/products', params)).toBe(
        '/api/v1/products?q=cricket+bat&minPrice=500&maxPrice=2000&rating=4'
      );
    });

    it('handles array parameters by appending them repeatedly', () => {
      const params = {
        category: ['sports', 'fitness'],
      };

      expect(buildSearchUrl('/api/v1/products', params as any)).toBe(
        '/api/v1/products?category=sports&category=fitness'
      );
    });

    it('returns base endpoint if params is empty', () => {
      expect(buildSearchUrl('/api/v1/products', {})).toBe('/api/v1/products');
    });
  });
});
