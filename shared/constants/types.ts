/**
 * Complete type map of the constants barrel public API.
 *
 * This interface serves as:
 * 1. Living documentation of all exported constants
 * 2. Breaking change detection (compile fails if barrel diverges)
 * 3. IntelliSense discovery for new team members
 *
 * KEEP IN SYNC with constants/index.ts exports.
 * Run: npm run type-check to verify consistency.
 */
export interface ConstantsPublicApi {
  // Schema Version
  CONSTANTS_SCHEMA_VERSION: string;
  isCurrentSchemaVersion: (data: unknown) => boolean;
  withSchemaVersion: <T>(data: T) => {
    readonly __version: string;
    readonly data: T;
    readonly cachedAt: string;
  };

  // Localization
  LANGUAGES: readonly import('./localization/languages').Language[];
  CURRENCIES: Readonly<
    Record<
      import('./localization/currencies').CurrencyCode,
      import('./localization/currencies').Currency
    >
  >;
  DEFAULT_CURRENCY: import('./localization/currencies').CurrencyCode;

  // Theme & Layout
  ACCENT_COLORS: readonly import('./theme/accent-colors').AccentColorConfig[];
  GRID_COLS_MAP: Readonly<Record<import('./theme/layout').GridColsCount, string>>;

  // Navigation
  SETTINGS_TABS: readonly import('./navigation/settings-tabs').SettingsTab[];

  // Domain
  CATEGORIES: readonly import('./domain/categories').ProductCategory[];
  CATEGORY_IDS: typeof import('./domain/categories').CATEGORY_IDS;
  isCategoryId: (value: string) => value is import('./domain/categories').CategoryId;
  sortCategories: (
    categories: readonly import('./domain/categories').ProductCategory[]
  ) => readonly import('./domain/categories').ProductCategory[];
  getActiveCategories: (
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => readonly import('./domain/categories').ProductCategory[];
  findCategoryById: (
    id: string,
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => import('./domain/categories').ProductCategory | undefined;
  findCategoryBySlug: (
    slug: string,
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => import('./domain/categories').ProductCategory | undefined;
  formatCategoryCount: (count: number) => string;
  getCategoryChildren: (
    parentId: import('./domain/categories').CategoryId,
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => readonly import('./domain/categories').ProductCategory[];
  getCategoryAncestors: (
    categoryId: import('./domain/categories').CategoryId,
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => readonly import('./domain/categories').ProductCategory[];
  buildCategoryTree: (
    categories?: readonly import('./domain/categories').ProductCategory[]
  ) => readonly import('./domain/categories').CategoryTreeNode[];
  PRODUCT_LIMITS: typeof import('./domain/product-config').PRODUCT_LIMITS;

  // Business Rules
  ORDER_STATUS: typeof import('./domain/order').ORDER_STATUS;
  PAYMENT_STATUS: typeof import('./domain/payment').PAYMENT_STATUS;
  PRODUCT_STATUS: typeof import('./domain/product').PRODUCT_STATUS;
  PRICE_RANGE: typeof import('./domain/product').PRICE_RANGE;
  RATING: typeof import('./domain/product').RATING;
  INVENTORY: typeof import('./domain/product').INVENTORY;
  CURRENCY_SYMBOLS: typeof import('./domain/payment').CURRENCY_SYMBOLS;

  // Auth Roles
  USER_ROLES: typeof import('./auth/roles').USER_ROLES;

  // API & Network
  API_ENDPOINTS: typeof import('./api/endpoints').API_ENDPOINTS;
  API_CONFIG: typeof import('./api/endpoints').API_CONFIG;
  HTTP_STATUS: typeof import('./api/endpoints').HTTP_STATUS;
  isClientError: (status: number) => boolean;
  isServerError: (status: number) => boolean;
  isSuccess: (status: number) => boolean;
  isRetryable: (status: number) => boolean;

  // Infrastructure
  PAGINATION: typeof import('./pagination').PAGINATION;
  VALIDATION: typeof import('./validation').VALIDATION;
  FILE_UPLOAD: typeof import('./upload').FILE_UPLOAD;

}
