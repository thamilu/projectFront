import * as Constants from '@/shared/constants';
import * as Utils from '@/shared/utils';
import * as Schemas from '@/shared/schemas';
import * as Routes from '@/shared/routes';

describe('Barrel Layer Boundary Enforcement', () => {
  // ── Constants barrel must NOT contain utilities ───────────────────────────
  describe('constants/index.ts layer purity', () => {
    const utilFunctionNames = [
      'validateId',
      'validateSlug',
      'validateHandle',
      'validateSlugOrId',
      'validateAlphanumeric',
      'buildQueryString',
      'buildSearchUrl',
      'PathSegmentError',
    ];

    utilFunctionNames.forEach((name) => {
      test(`should NOT export utility: ${name}`, () => {
        expect(Constants).not.toHaveProperty(name);
      });
    });

    const schemaNames = ['LanguageSchema', 'CurrencySchema'];
    schemaNames.forEach((name) => {
      test(`should NOT export schema: ${name}`, () => {
        expect(Constants).not.toHaveProperty(name);
      });
    });

    const routeNames = ['APP_ROUTES', 'API_ROUTE_PREFIXES', 'PROTECTED_ROUTE_PREFIXES'];
    routeNames.forEach((name) => {
      test(`should NOT export route: ${name}`, () => {
        expect(Constants).not.toHaveProperty(name);
      });
    });

    const mockNames = ['DEMO_PRODUCTS', 'flashDeals', 'featuredProducts', 'testimonials'];
    mockNames.forEach((name) => {
      test(`should NOT export mock data: ${name}`, () => {
        expect(Constants).not.toHaveProperty(name);
      });
    });
  });

  // ── Utils barrel must NOT contain constants ───────────────────────────────
  describe('utils/index.ts layer purity', () => {
    const constantNames = ['API_ENDPOINTS', 'API_CONFIG', 'HTTP_STATUS', 'LANGUAGES'];
    constantNames.forEach((name) => {
      test(`should NOT export constant: ${name}`, () => {
        expect(Utils).not.toHaveProperty(name);
      });
    });
  });

  // ── Required exports must exist ───────────────────────────────────────────
  describe('constants/index.ts completeness', () => {
    const requiredExports = [
      'CONSTANTS_SCHEMA_VERSION',
      'isCurrentSchemaVersion',
      'withSchemaVersion',
      'LANGUAGES',
      'CURRENCIES',
      'DEFAULT_CURRENCY',
      'ACCENT_COLORS',
      'GRID_COLS_MAP',
      'SETTINGS_TABS',
      'CATEGORIES',
      'CATEGORY_IDS',
      'isCategoryId',
      'sortCategories',
      'getActiveCategories',
      'findCategoryById',
      'findCategoryBySlug',
      'formatCategoryCount',
      'getCategoryChildren',
      'getCategoryAncestors',
      'buildCategoryTree',
      'PRODUCT_LIMITS',
      'ORDER_STATUS',
      'PAYMENT_STATUS',
      'PRODUCT_STATUS',
      'PRICE_RANGE',
      'RATING',
      'INVENTORY',
      'CURRENCY_SYMBOLS',
      'USER_ROLES',
      'API_ENDPOINTS',
      'API_CONFIG',
      'HTTP_STATUS',
      'isClientError',
      'isServerError',
      'isSuccess',
      'isRetryable',
      'PAGINATION',
      'VALIDATION',
      'FILE_UPLOAD',
    ];

    requiredExports.forEach((name) => {
      test(`should export: ${name}`, () => {
        expect(Constants).toHaveProperty(name);
      });
    });
  });

  // ── Verify new barrels export expected values ──────────────────────────────
  describe('Schemas barrel completeness', () => {
    test('should export expected schemas', () => {
      expect(Schemas).toHaveProperty('profileSchema');
      expect(Schemas).toHaveProperty('PhoneSchema');
      expect(Schemas).toHaveProperty('PincodeSchema');
      expect(Schemas).toHaveProperty('AddressSchema');
    });
  });

  describe('Routes barrel completeness', () => {
    test('should export expected routes', () => {
      expect(Routes).toHaveProperty('APP_ROUTES');
      expect(Routes).toHaveProperty('API_ROUTE_PREFIXES');
      expect(Routes).toHaveProperty('PROTECTED_ROUTE_PREFIXES');
    });
  });
});
