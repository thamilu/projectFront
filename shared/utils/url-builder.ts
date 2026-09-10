export interface ProductSearchParams {
  readonly q?: string;
  readonly category?: string;
  readonly brand?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly rating?: 1 | 2 | 3 | 4 | 5;
  readonly sortBy?: 'price' | 'rating' | 'newest' | 'popularity';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly size?: number;
  readonly inStock?: boolean;
}

/**
 * Safely builds query strings using the Web API URLSearchParams.
 * Automatically encodes all special characters.
 */
export const buildQueryString = (
  params: Record<string, string | number | boolean | null | undefined>
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Safely constructs a search URL with validated and typed parameters.
 */
export const buildSearchUrl = (baseEndpoint: string, params: ProductSearchParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `${baseEndpoint}?${qs}` : baseEndpoint;
};
